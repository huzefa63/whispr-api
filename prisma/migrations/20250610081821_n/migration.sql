/*
  Warnings:

  - You are about to drop the column `friendId` on the `Chat` table. All the data in the column will be lost.
  - Added the required column `user2Id` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_friendId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "friendId",
ADD COLUMN     "user2Id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
