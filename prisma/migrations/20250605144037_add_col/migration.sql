/*
  Warnings:

  - A unique constraint covering the columns `[contactNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contactNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contactNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_contactNumber_key" ON "User"("contactNumber");
