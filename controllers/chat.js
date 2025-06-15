import prisma from '../lib/prisma.js';
import catchAsync from '../lib/catchAsync.js';

export const getChats = catchAsync(async (req,res,next) => {
    console.log('req')
    const {id:userId} = req.user;
    const chatRes = await prisma.chat.findMany({
      where: {
        OR: [{ userId: userId }, { user2Id: userId }],
      },
      include: {
        user:true,
        user2:true
      },
      orderBy:{
        recentMessageCreatedAt:'desc'
      }
    });
    res.status(200).json({status:'success',chats:chatRes,currentUserId:userId});
})
export const createChat = catchAsync(async (req, res, next) => {
  const { contactNumber } = req.params;
  console.log(contactNumber);
  const userId = req.user.id;
  const friend = await prisma.user.findUnique({
      where:{
          contactNumber:contactNumber,
        }
    })
    if(!friend) return res.status(400).json({status:"friend does not exist"});
    const friendId = friend.id;
    const chatsExists = await prisma.chat.findFirst({
      where: {
        OR: [
          { userId, user2Id: friendId },
          { userId: friendId, user2Id: userId },
        ],
      },
    });
    if(chatsExists) next({statusCode:500,message:'chat already exists'});
  const chatRes = await prisma.chat.create({
    data:{
        userId:userId,
        user2Id:friendId,
    }
  });
  res.status(200).json({ status: "success", chats: chatRes });
});
export const deleteChat = catchAsync(async (req, res, next) => {
  const userId = req.user?.id;
  const {user,user2} = req.query;
  if(userId != user && userId != user2) return res.status(400).json({status:'you are not authorized'})
  await prisma.chat.deleteMany({
    where:{
      OR:[
        {userId:Number(user),user2Id:Number(user2)},
        {userId:Number(user2),user2Id:Number(user)},
      ]
    }
  })
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: Number(user), recieverId: Number(user2) },
        { senderId: Number(user2), recieverId: Number(user) },
      ],
    },
  });
  res.status(200).json({ status: "success"});
});

