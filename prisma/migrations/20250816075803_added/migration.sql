-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "replyText" TEXT,
ADD COLUMN     "replyTextId" TEXT,
ADD COLUMN     "replyTextSenderId" INTEGER;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyTextSenderId_fkey" FOREIGN KEY ("replyTextSenderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
