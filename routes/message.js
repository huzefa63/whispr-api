import express from 'express';
import { getMessages, readMessages, resizeImage, sendMessages, upload } from '../controllers/message.js';
import { protectRoute } from '../controllers/user.js';

const route = express.Router();

route.get('/getMessages',protectRoute,getMessages);
route.post('/sendMessage',protectRoute,upload.single('media'),resizeImage,sendMessages);
route.get('/readMessages/:friendId',protectRoute,readMessages);
// route.post('/sendMessage',upload.single('media'),resizeImage,sendMessages);

export default route;