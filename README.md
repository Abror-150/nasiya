# Nasiya Savdo API

Mijozlarga qarz asosida tovar/xizmat sotishni boshqaruvchi tizim.
Sotuvchilar qarz va to'lov jarayonlarini to'liq nazorat qiladi.

## Stack
NestJS • PostgreSQL • Prisma • Docker • JWT

## Asosiy funksiyalar
- Sotuvchi va admin role tizimi
- Mijozlarni ro'yxatga olish (rasm, telefon, manzil)
- Qarz berish — muddatli to'lov asosida
- 3 xil to'lov usuli:
  - Bir oylik (one-month)
  - Ko'p oylik (multi-month)
  - Qisman (custom amount)
- Oyma-oy to'lov holati: PAID / UNPAID / PENDING
- Dashboard statistika — umumiy qarz, to'langan, qoldiq
- To'lovlar tarixi — sana bo'yicha guruhlangan

## Ishga tushirish
git clone https://github.com/abror-150/nasiya-savdo.git
cd nasiya-savdo
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

## Environment variables (.env.example)
DATABASE_URL=postgresql://user:password@localhost:5432/nasiya
JWT_SECRET=your-secret-key
PORT=3000

## API endpoints
POST /auth/login              — Kirish
GET  /mijoz                   — Mijozlar ro'yxati
POST /mijoz                   — Mijoz qo'shish
POST /debt                    — Qarz yaratish
GET  /debt/:id                — Qarz ma'lumoti
POST /tolovlar/one-month      — Bir oylik to'lov
POST /tolovlar/multi-month    — Ko'p oylik to'lov
POST /tolovlar/custom         — Qisman to'lov
GET  /tolovlar/dashboard      — Statistika
GET  /tolovlar/history        — To'lovlar tarixi
