import express from 'express';
import {
  getMessages,
  readMessages,
  resizeImage,
  sendMessages,
  upload,
  deleteMessages,
  deleteMessage,
  updateMessage,
} from "../controllers/message.js";
import { protectRoute } from '../controllers/user.js';

const route = express.Router();

route.get('/getMessages',protectRoute,getMessages);
route.post('/sendMessage',protectRoute,upload.single('media'),resizeImage,sendMessages);
route.delete('/deleteMessages/:friendId',protectRoute,deleteMessages);
route.get('/readMessages/:friendId',protectRoute,readMessages);
route.delete('/deleteMessage',protectRoute,deleteMessage);
route.patch('/updateMessage/:messageId',protectRoute,updateMessage);
// route.post('/sendMessage',upload.single('media'),resizeImage,sendMessages);

export default route;