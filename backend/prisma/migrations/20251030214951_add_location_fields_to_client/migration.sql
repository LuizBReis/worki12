/*
  Warnings:

  - You are about to drop the column `location` on the `ClientProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClientProfile" DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT;
