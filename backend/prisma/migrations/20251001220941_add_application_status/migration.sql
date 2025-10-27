-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "public"."JobApplication" DROP CONSTRAINT "JobApplication_jobId_fkey";

-- AlterTable
ALTER TABLE "public"."JobApplication" ADD COLUMN     "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "public"."JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
