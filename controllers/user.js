import catchAsync from "../lib/catchAsync.js";
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
export const createUser = catchAsync(async (req,res,next) => {
    console.log(req.body.image);
    const {email,name,password:plainpassword,passwordConfirm,contactNumber} = req.body;
    if(!plainpassword || !email || !contactNumber) return res.status(400).json({ status: "bad req" });
    if(plainpassword !== passwordConfirm) return res.status(400).json({status:"password didn't match"});
    const password = await bcrypt.hash(plainpassword,12);
    const payload = await prisma.user.create({data:{email,name,password,contactNumber,profileImage:req.body?.image}})
    const token = jwt.sign(payload,process.env.SECRET,{expiresIn:'7d'});
    res.status(201).json({status:'success',jwt:token,user:payload});
})

export const getUser = catchAsync(async (req,res,next) => {
    const {friendId} = req.params;
    if(!friendId) return;
    const response = await prisma.user.findUnique({
        where:{
            id:Number(friendId)
        }
    })
    res.status(201).json({status:'success',friend:response});
})

export const verifyUser = catchAsync(async (req,res,next) => {
    console.log('req to cookies');
    const {jwt:token} = req.cookies;
    if(!token) return res.status(400).json({status:'no cookie'});
    const user = jwt.verify(token,process.env.SECRET);
    res.status(200).json({status:'success',user});
})

export const protectRoute = catchAsync(async (req,res,next) => {
    console.log('protect');
    const token = req.headers.authorization.split('=')[1];
    console.log('jwt: ',token);
    if(!token) return res.status(401).json({status:'no cookie'});
    const user = jwt.verify(token,process.env.SECRET);
    req.user = user;
    next();
})

