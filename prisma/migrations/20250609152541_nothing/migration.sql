/*
  Warnings:

  - You are about to drop the column `mediaType` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "mediaType",
ADD COLUMN     "Type" TEXT;
