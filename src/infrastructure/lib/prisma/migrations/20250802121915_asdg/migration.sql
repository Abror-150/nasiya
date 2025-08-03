-- DropForeignKey
ALTER TABLE "TolovOy" DROP CONSTRAINT "TolovOy_tolovId_fkey";

-- DropForeignKey
ALTER TABLE "Tolovlar" DROP CONSTRAINT "Tolovlar_debtId_fkey";

-- AddForeignKey
ALTER TABLE "Tolovlar" ADD CONSTRAINT "Tolovlar_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TolovOy" ADD CONSTRAINT "TolovOy_tolovId_fkey" FOREIGN KEY ("tolovId") REFERENCES "Tolovlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
