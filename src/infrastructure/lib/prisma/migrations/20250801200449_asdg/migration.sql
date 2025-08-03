-- CreateEnum
CREATE TYPE "statusType" AS ENUM ('PAID', 'UNPAID');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "paidAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Tolovlar" ADD COLUMN     "months" INTEGER[],
ALTER COLUMN "duration" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TolovOy" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "tolovId" TEXT NOT NULL,
    "status" "statusType" NOT NULL,

    CONSTRAINT "TolovOy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TolovOy" ADD CONSTRAINT "TolovOy_tolovId_fkey" FOREIGN KEY ("tolovId") REFERENCES "Tolovlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
