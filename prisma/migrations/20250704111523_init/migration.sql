-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "category" TEXT,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "overdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveQuestion" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectiveQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ObjectiveQuestions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ObjectiveQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObjectiveQuestion_objectiveId_questionId_key" ON "ObjectiveQuestion"("objectiveId", "questionId");

-- CreateIndex
CREATE INDEX "_ObjectiveQuestions_B_index" ON "_ObjectiveQuestions"("B");

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveQuestion" ADD CONSTRAINT "ObjectiveQuestion_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveQuestion" ADD CONSTRAINT "ObjectiveQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectiveQuestions" ADD CONSTRAINT "_ObjectiveQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectiveQuestions" ADD CONSTRAINT "_ObjectiveQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
