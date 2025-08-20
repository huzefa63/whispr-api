-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "deletedBy" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
