-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "fileType" TEXT NOT NULL DEFAULT 'audio',
ADD COLUMN     "hasVideo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
