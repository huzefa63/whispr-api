import jsonwebtoken from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import bcrypt from 'bcrypt'
import catchAsync from "../lib/catchAsync.js";

    export const signInUser = catchAsync(async (req,res,next) => {
        const {email,password} = req.body;
        console.log(req.body)
        const payload = await prisma.user.findUnique({
            where:{
                email
            }
        })
        if(!await bcrypt.compare(password,payload.password)){
            next({statusCode:401,message:'email or password is incorrect'});
        }
        const jwt = jsonwebtoken.sign(payload,process.env.SECRET);
        res.cookie("auth_token", jwt, {
          httpOnly: true, // prevent JavaScript access
          secure: true, // required for HTTPS
          sameSite: "none", // allow cross-site cookie
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({ status: "success", jwt });
    })