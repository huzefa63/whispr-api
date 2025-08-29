import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoute from './routes/user.js';
import chatRoute from './routes/chat.js';
import messageRoute from './routes/message.js';
import authRoute from './routes/auth.js';
import cookieParser from 'cookie-parser';
import { jwtDecode } from 'jwt-decode';
import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from './lib/prisma.js';
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors:{origin:'*'}
});

app.use(cookieParser());

app.use(express.json());
app.use(cors({origin:'*',credentials:true}));
app.use(express.urlencoded({extended:true}));

app.use('/user',userRoute);
app.use('/chat',chatRoute);
app.use('/message',messageRoute);
app.use('/auth',authRoute);
// app.use('/auth',userRoute);

export let socketUsers = new Map();


io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.jwt;

    if (!token) {
      console.warn("❌ No token provided in handshake");
      return next(new Error("Authentication error: No token"));
    }

    const payload = jsonwebtoken.verify(token, process.env.SECRET);
    socket.userId = payload.id;

    return next();
  } catch (err) {
    console.log('socket auth failed');
    console.error("❌ JWT verification failed:", err.message);
    return next(new Error("Authentication error: Invalid token"));
  }
});


io.on('connection',async (socket) => {
    console.log('user connected',socket.id);
    console.log('map after user connected: ',socketUsers)
    const userId = socket.userId;
    if(socketUsers.has(userId)){
      console.log('socket user already exists')
        const oldSocket = socketUsers.get(userId);
        oldSocket?.disconnect?.(true);
    }
    socketUsers.set(userId,socket);
    const user = await prisma.user.findUnique({where:{id:userId}})
    if(user){
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            status: "online",
          },
        });
    }else{
        socket.disconnect();
    }
    console.log(socketUsers.keys());
    socket.on('typing',({typerId,toTypingId}) => {
        if(socketUsers.has(toTypingId)){
            socket.to(socketUsers.get(toTypingId)?.id).emit('typing',typerId);
        }
        console.log(socketUsers.get(toTypingId)?.id);
    })
    socket.on('start-call',({from,to,offer,type}) => {
      // console.log('call incoming',from,to)
      // console.log('call coming from',socketUsers.get(from));
      // console.log('call to',socketUsers.get(to));
      // console.log('start-call-with: ', socketUsers.get(to)?.id);
      // console.log('is user found to call: ',socketUsers.has(to));
      if(socketUsers.has(to)){
        console.log('user found to start call');
        socket.to(socketUsers.get(to).id).emit('call-incoming',{from,remoteOffer:offer,type});
      }
    })
    socket.on('line-busy',({to}) => {
      socket.to(socketUsers.get(Number(to)).id).emit('line-busy');
    })
    socket.on('ice-candidate',({from,to,candidate}) => {
      console.log('ice coming',from,to)
      if(socketUsers.has(to)){
        socket.to(socketUsers.get(to).id).emit('ice-candidate',{from,to,candidate});
      }
    })
    socket.on('answer',({from,to,answer}) => {
      console.log('answer coming');
      if(socketUsers.has(to)){
        socket.to(socketUsers.get(to).id).emit('answer',{from,to,answer});
      }
    })
    socket.on('reject-call',({caller}) => {
      console.log('call rejected , caller: ',caller)
      if(socketUsers.has(Number(caller))){
        socket.to(socketUsers.get(Number(caller)).id).emit('call-rejected');
      }
    })
    socket.on('end-call',({callee}) => {
      // console.log('call rejected , caller: ',caller)
      if(socketUsers.has(callee)){
        socket.to(socketUsers.get(callee).id).emit('call-rejected');
      }
    })

    socket.on('disconnect',async () => {
      const userId = socket?.userId;
      console.log('disconnected: ',userId)
        const user = await prisma.user.findUnique({where:{id:userId}})

        if(user){
            if (socketUsers.has(userId)) {
              socketUsers.delete(userId);
              await prisma.user.update({
                where: {
                  id: userId,
                },
                data: {
                  status: "offline",
                  lastSeen: new Date(),
                },
              });
              console.log("user socket disconnected: ", socketUsers.get(Number(userId)));
              console.log("user disconnected", userId);

            } 
        }
    })
})

app.use('/keepServerAlive',(req,res) => res.send('backend is alive'));



export default io;

server.listen(process.env.PORT,()=> console.log('hello'));
