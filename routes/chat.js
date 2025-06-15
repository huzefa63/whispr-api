import express from 'express';
import { getChats, createChat, deleteChat } from '../controllers/chat.js';
import { protectRoute } from '../controllers/user.js';

const route = express.Router();

route.get('/getChats',protectRoute,getChats);
route.delete('/deleteChat',protectRoute,deleteChat);
route.get('/createChat/:contactNumber',protectRoute,createChat);
export default route;