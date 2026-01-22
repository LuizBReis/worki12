/*
  Warnings:

  - You are about to drop the column `address` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `ClientProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClientProfile" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "state";

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
