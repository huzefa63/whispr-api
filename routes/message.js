import express from 'express';
import { getMessages, resizeImage, sendMessages, upload } from '../controllers/message.js';
import { protectRoute } from '../controllers/user.js';

const route = express.Router();

route.get('/getMessages',protectRoute,getMessages);
route.post('/sendMessage',protectRoute,upload.single('media'),resizeImage,sendMessages);
// route.post('/sendMessage',upload.single('media'),resizeImage,sendMessages);

export default route;