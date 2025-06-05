import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const server = http.createServer(app);
const socket = new Server(server);

app.use(express.json());
app.use(cors({origin:'*'}));
app.use(express.urlencoded({extended:true}));

socket.on('connection',(socket) => {
    console.log('user connected',socket.id);
})
export default socket;

server.listen(process.env.PORT,()=> console.log('hello'));