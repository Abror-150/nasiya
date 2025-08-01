/*
  Warnings:

  - The values [PAYMENT,CLICk] on the enum `methodType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "methodType_new" AS ENUM ('FULL', 'PARTIAL', 'BY_DURATION');
ALTER TABLE "Tolovlar" ALTER COLUMN "method" TYPE "methodType_new" USING ("method"::text::"methodType_new");
ALTER TABLE "Namuna" ALTER COLUMN "isActive" TYPE "methodType_new" USING ("isActive"::text::"methodType_new");
ALTER TYPE "methodType" RENAME TO "methodType_old";
ALTER TYPE "methodType_new" RENAME TO "methodType";
DROP TYPE "methodType_old";
COMMIT;
