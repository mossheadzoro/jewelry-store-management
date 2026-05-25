-- AlterTable
ALTER TABLE "KarigarHeldMetal" ADD COLUMN     "karigarJobId" TEXT;

-- AddForeignKey
ALTER TABLE "KarigarHeldMetal" ADD CONSTRAINT "KarigarHeldMetal_karigarJobId_fkey" FOREIGN KEY ("karigarJobId") REFERENCES "KarigarJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
