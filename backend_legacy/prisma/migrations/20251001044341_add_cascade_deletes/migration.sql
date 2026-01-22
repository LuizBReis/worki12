-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."JobApplication" DROP CONSTRAINT "JobApplication_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkExperience" DROP CONSTRAINT "WorkExperience_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobApplication" ADD CONSTRAINT "JobApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkExperience" ADD CONSTRAINT "WorkExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
