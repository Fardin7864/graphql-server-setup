-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'BDT', 'INR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "profile_img_url" TEXT,
    "mobile" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "promoCode" TEXT,
    "email" TEXT,
    "password" TEXT,
    "salt" TEXT NOT NULL,
    "iv" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
