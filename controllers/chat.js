import prisma from '../lib/prisma.js';
import catchAsync from '../lib/catchAsync.js';

export const getChats = catchAsync(async (req,res,next) => {
    console.log('req')
    const {id:userId} = req.user;
    const chatRes = await prisma.chat.findMany({
      where: {
        OR: [{ userId: Number(userId) }, { user2Id: Number(userId) }],
      },
      include: {
        user:true,
        user2:true
      },
    });
    res.status(200).json({status:'success',chats:chatRes,currentUserId:userId});
})
export const createChat = catchAsync(async (req, res, next) => {
  const { contactNumber } = req.params;
  console.log(contactNumber);
  const friend = await prisma.user.findUnique({
      where:{
          contactNumber:contactNumber,
        }
    })
    const chatsExists = await prisma.chat.findFirst({
        where:{
            userId:req?.user?.id,
            user2Id:friend?.id
        }
    })
    if(chatsExists) next({statusCode:500,message:'chat already exists'});
  const chatRes = await prisma.chat.create({
    data:{
        userId:req.user?.id,
        user2Id:friend.id,
    }
  });
  res.status(200).json({ status: "success", chats: chatRes });
});

