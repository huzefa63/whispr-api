import express from 'express';
import { signInUser } from '../controllers/auth.js';

const route = express.Router();

route.post('/signIn',signInUser);

export default route;