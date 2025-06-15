import prisma from "../lib/prisma.js";
import catchAsync from "../lib/catchAsync.js";
import { socketUsers } from "../app.js";
import io from '../app.js'
import multer from "multer";
import sharp from "sharp";
import { Readable } from 'stream'; // ✅ for ES modules
import cloudinary from "../cloudinary.js";

export const getMessages = catchAsync(async (req,res,next) => {
    const {friendId} = req.query;
    const {id:userId} = req.user;
    console.log(userId,friendId);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: Number(friendId),
            recieverId: Number(userId),
          },
          {
            senderId: Number(userId),
            recieverId: Number(friendId),
          },
        ],
      },
      orderBy: {
        time: "asc",
      },
    });
    res.status(200).json({status:'success',messages})
})

export const deleteMessages = catchAsync(async (req, res, next) => {
  const { friendId } = req.params;
  const { id: userId } = req.user;
  console.log(friendId);
  
  if (!friendId || friendId === "null" || friendId === "undefined") {
    return res.status(200).json({ message: "no friend id" });
  }
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: userId, recieverId: Number(friendId) },
        { senderId: Number(friendId), recieverId: userId },
      ],
    },
  });
  console.log("from friend", friendId);
  await prisma.chat.updateMany({
    where: {
      OR: [
        { userId: userId, user2Id: Number(friendId) },
        { userId: Number(friendId), user2Id: userId },
      ],
    },
    data: {
      isRecentMessageRead: false,
      recentMessage:null,
      recentMessageCreatedAt:null,
      recentMessageSenderId:null
    },
  });
  const messages = await prisma.message.updateMany({
    data: {
      isRead: true,
    },
    where: {
      senderId: Number(friendId),
      recieverId: userId,
    },
  });
  const friendSocketId = socketUsers.get(Number(friendId))?.id;
  io.to(friendSocketId).emit("message-read", {
    friendId: Number(friendId),
    userId: userId,
  });
  res.status(200).json({ status: "success" });
});
;
export const readMessages = catchAsync(async (req,res,next) => {
    const {friendId} = req.params;
    const {id:userId} = req.user;
    console.log(userId,friendId);
    if (!friendId || friendId === "null" || friendId === "undefined"){

      return res.status(200).json({ message: "no friend id" });
    }
    console.log('from friend',friendId);
    await prisma.chat.updateMany({
      where: {
        OR: [
          { userId: userId, user2Id: Number(friendId) },
          { userId: Number(friendId), user2Id: userId },
        ],
        recentMessageSenderId:{not:userId}
      },
      data:{
        isRecentMessageRead:true
      }
    });
    const messages = await prisma.message.updateMany({
      data:{
        isRead:true
      },
      where: {
       senderId:Number(friendId),
       recieverId:userId
      },
    });
    const friendSocketId = socketUsers.get(Number(friendId))?.id;
    io.to(friendSocketId).emit("message-read", {
      friendId: Number(friendId),
      userId: userId,
    });
    res.status(200).json({status:'success'});
})

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb) => {
  console.log('from file',file);
  if(file.mimetype.startsWith('image/')){
    cb(null,true);
  }else{
    cb(new Error('only image are allowed'),false);
  }
}

export const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter,
})

export const resizeImage = async (req,res,next) => {
  const file = req.file;
  if(!file) {
    console.log("no file found to resize");
    return next();
  }
  console.log('resizing image');
  const imageBuffer = await sharp(req.file.buffer).resize(400,400).jpeg({quality:80}).toBuffer();
  const readableBuffer = new Readable();
  readableBuffer.push(imageBuffer);
  readableBuffer.push(null);

  const stream = cloudinary.uploader.upload_stream({
    resource_type:'auto',
  },(err,result) => {
    if(err) next({statusCode:500,message:'error'});
    console.log('secure url',result.secure_url);
    req.body.image = result.secure_url;
    next();
  })

  readableBuffer.pipe(stream);
}

export const sendMessages = catchAsync(async (req,res,next) => {
    const {message,recieverId,caption,uniqueId} = req.body;
    const senderId = req.user?.id;
    let socketRes = {};
    console.log('from main handler',req.body?.image)
  if(req.body?.image) {
    const ress = await prisma.message.create({
      data: { mediaUrl:req.body?.image, senderId, recieverId: Number(recieverId),caption:caption ||'',Type:'image' },
      // data: { mediaUrl:req.image, senderId, recieverId: 2,caption:caption ||'' },
    });
    const updatedChat = await prisma.chat.updateManyAndReturn({
      where: {
        OR: [
          { userId: senderId, user2Id: Number(recieverId) },
          { userId: Number(recieverId), user2Id: senderId },
        ],
      },
      data: {
        recentMessage: { set: "photo" },
        recentMessageSenderId: { set: senderId },
        isRecentMessageRead: { set: false },
        recentMessageCreatedAt: new Date(),
      },
      include:{
        user:true,
        user2:true,
      }
    });
    console.log('after db save',ress);
    socketRes.mediaUrl = req.body?.image;
    socketRes.senderId = senderId;
    socketRes.recieverId = recieverId;
    socketRes.caption = caption || '';
    socketRes.time = new Date().toISOString();
    socketRes.Type = "image"
    console.log('chat: ',updatedChat)
    socketRes.chat = updatedChat;
    socketRes.isRead = false;
  }

    if(!req.body?.image){

      await prisma.message.create({
        data: { message, senderId, recieverId: Number(recieverId) },
      });
      console.log('heeee',senderId,recieverId)
      const updatedChat = await prisma.chat.updateManyAndReturn({
        where: {
          OR: [
            { userId: senderId, user2Id: Number(recieverId) },
            { userId: Number(recieverId), user2Id: senderId },
          ],
        },
        include:{
          user:true,
          user2:true,
        },
        data: {
          // lastMessage: message,
          recentMessage: { set: message },
          recentMessageSenderId: { set: senderId },
          isRecentMessageRead:{set:false},
          recentMessageCreatedAt: new Date()
        },
      });
      socketRes.senderId = senderId;
      socketRes.recieverId = recieverId;
      socketRes.time = new Date().toISOString();
      socketRes.message = message;
      socketRes.Type = "text"
      socketRes.chat = updatedChat;
      socketRes.uniqueId = uniqueId;
      socketRes.isRead = false;
    }
    const recieverSocketId = socketUsers.get(Number(recieverId))?.id;
    const senderSocketId = socketUsers.get(senderId)?.id;
    io.to(recieverSocketId).emit("messageRecieved", socketRes);
    io.to(senderSocketId).emit("messageRecieved", socketRes);
    res.status(200).json({status:'success'});
})
