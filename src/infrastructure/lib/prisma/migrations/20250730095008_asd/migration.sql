-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "methodType" AS ENUM ('PAYMENT', 'CLICk');

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mijoz" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,

    CONSTRAINT "Mijoz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneClient" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "mijozId" TEXT NOT NULL,

    CONSTRAINT "PhoneClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagesClient" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mijozId" TEXT NOT NULL,

    CONSTRAINT "ImagesClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "mijozId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "creadetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "muddat" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "mijozId" TEXT NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneDebt" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,

    CONSTRAINT "PhoneDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagesDebt" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,

    CONSTRAINT "ImagesDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tolovlar" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "methodType" NOT NULL,
    "duration" TEXT NOT NULL,

    CONSTRAINT "Tolovlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Namuna" (
    "id" TEXT NOT NULL,
    "text" INTEGER NOT NULL,
    "sellerId" TEXT NOT NULL,
    "isActive" "methodType" NOT NULL,
    "creadetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Namuna_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhoneClient" ADD CONSTRAINT "PhoneClient_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagesClient" ADD CONSTRAINT "ImagesClient_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_mijozId_fkey" FOREIGN KEY ("mijozId") REFERENCES "Mijoz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneDebt" ADD CONSTRAINT "PhoneDebt_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagesDebt" ADD CONSTRAINT "ImagesDebt_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tolovlar" ADD CONSTRAINT "Tolovlar_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Namuna" ADD CONSTRAINT "Namuna_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
