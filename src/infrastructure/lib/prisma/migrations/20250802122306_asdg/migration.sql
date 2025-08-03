-- DropForeignKey
ALTER TABLE "ImagesClient" DROP CONSTRAINT "ImagesClient_mijozId_fkey";

-- DropForeignKey
ALTER TABLE "ImagesDebt" DROP CONSTRAINT "ImagesDebt_debtId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_mijozId_fkey";

-- DropForeignKey
ALTER TABLE "Namuna" DROP CONSTRAINT "Namuna_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "PhoneClient" DROP CONSTRAINT "PhoneClient_mijozId_fkey";

-- DropForeignKey
ALTER TABLE "PhoneDebt" DROP CONSTRAINT "PhoneDebt_debtId_fkey";

-- AddForeignKey
ALTER TABLE "PhoneClient" ADD CONSTRAINT "PhoneClient_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagesClient" ADD CONSTRAINT "ImagesClient_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneDebt" ADD CONSTRAINT "PhoneDebt_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagesDebt" ADD CONSTRAINT "ImagesDebt_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Namuna" ADD CONSTRAINT "Namuna_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
