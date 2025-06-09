import express from 'express';
import { getChats, createChat } from '../controllers/chat.js';
import { protectRoute } from '../controllers/user.js';

const route = express.Router();

route.get('/getChats',protectRoute,getChats);
route.get('/createChat/:contactNumber',protectRoute,createChat);
export default route;