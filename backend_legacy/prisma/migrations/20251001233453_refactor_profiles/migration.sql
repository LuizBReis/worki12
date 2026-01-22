/*
  Warnings:

  - You are about to drop the column `description` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `WorkExperience` table. All the data in the column will be lost.
  - You are about to drop the `_SkillToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `freelancerProfileId` to the `WorkExperience` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkExperience" DROP CONSTRAINT "WorkExperience_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_SkillToUser" DROP CONSTRAINT "_SkillToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_SkillToUser" DROP CONSTRAINT "_SkillToUser_B_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "public"."WorkExperience" DROP COLUMN "userId",
ADD COLUMN     "freelancerProfileId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."_SkillToUser";

-- CreateTable
CREATE TABLE "public"."FreelancerProfile" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FreelancerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientProfile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "location" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_FreelancerProfileToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FreelancerProfileToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreelancerProfile_userId_key" ON "public"."FreelancerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "public"."ClientProfile"("userId");

-- CreateIndex
CREATE INDEX "_FreelancerProfileToSkill_B_index" ON "public"."_FreelancerProfileToSkill"("B");

-- AddForeignKey
ALTER TABLE "public"."FreelancerProfile" ADD CONSTRAINT "FreelancerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkExperience" ADD CONSTRAINT "WorkExperience_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "public"."FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_FreelancerProfileToSkill" ADD CONSTRAINT "_FreelancerProfileToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_FreelancerProfileToSkill" ADD CONSTRAINT "_FreelancerProfileToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
