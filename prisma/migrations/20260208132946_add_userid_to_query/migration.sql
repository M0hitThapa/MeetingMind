-- AlterTable
ALTER TABLE "queries" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "queries_userId_idx" ON "queries"("userId");
