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
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors:{origin:'*'}
});

app.use(cookieParser());

app.use(express.json());
app.use(cors({origin:'*'}));
app.use(express.urlencoded({extended:true}));

app.use('/user',userRoute);
app.use('/chat',chatRoute);
app.use('/message',messageRoute);
app.use('/auth',authRoute);
// app.use('/auth',userRoute);

export let socketUsers = new Map();


io.use((socket,next) => {
    const token = socket.handshake.auth?.jwt;
    if(!token) next({statusCode:401,message:'you are not authenticated'});
    const payload = jsonwebtoken.verify(token,process.env.SECRET);
    socket.userId = payload.id;
    next();
})

io.on('connection',(socket) => {
    console.log('user connected',socket.id);
    const userId = socket.userId;
    if(socketUsers.has(userId)){
        const oldSocket = socketUsers.get(userId);
        oldSocket?.disconnect?.(true);
    }
    socketUsers.set(userId,socket);
    console.log(socketUsers.keys());
    socket.on('typing',({typerId,toTypingId}) => {
        if(socketUsers.has(toTypingId)){
            socket.to(socketUsers.get(toTypingId)?.id).emit('typing',typerId);
        }
        console.log(socketUsers.get(toTypingId)?.id);
    })
    socket.on('disconnect',() => {
        if(socketUsers.has(userId)){
            socketUsers.delete(userId);
            console.log('user disconnected',userId);
        }
    })
})

app.use('/keepServerAlive',(req,res) => console.log('server is alive'));



app.use((err,req,res,next) => {
    console.log(err);
    res.status(500).json({message:err?.message});
})

export default io;

server.listen(process.env.PORT,()=> console.log('hello'));