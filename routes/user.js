import express from 'express';
import { createUser, getUser, verifyUser } from '../controllers/user.js';
import { resizeImage, upload } from '../controllers/message.js';

const route = express.Router();

route.post('/createUser',upload.single('profileImage'),resizeImage,createUser);
route.get('/verifyUser',verifyUser);
route.get('/getFriend/:friendId',getUser);

export default route;