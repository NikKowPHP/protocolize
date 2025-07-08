-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answer" TEXT;

-- CreateTable
CREATE TABLE "UserTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTopic_userId_topicId_key" ON "UserTopic"("userId", "topicId");

-- AddForeignKey
ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
