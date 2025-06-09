import express from 'express';
import { createUser, getUser, verifyUser } from '../controllers/user.js';

const route = express.Router();

route.post('/createUser',createUser);
route.get('/verifyUser',verifyUser);
route.get('/getFriend/:friendId',getUser);

export default route;