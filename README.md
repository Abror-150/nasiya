# 💳 Nasiya Savdo – Backend

**Nasiya Savdo** — bu mijozlarga **qarz (nasiya) asosida tovar yoki xizmat sotishni boshqaruvchi tizim**.  
Platforma orqali mijozlar qarzga tovar olishi, sotuvchilar esa qarz va to‘lov jarayonlarini nazorat qilishi mumkin.  

---

## 🚀 Texnologiyalar (Stack)

- **Backend:** Node.js, NestJS  
- **ORM:** Prisma  
- **Database:** PostgreSQL  
- **API:** REST  
- **Deployment:** AWS / PM2 / Nginx (opsiyaga qarab)  

---

## 📌 Asosiy funksiyalar

- 👥 **Mijozlarni ro‘yxatga olish** (shaxsiy ma’lumotlar, kontaktlar).  
- 💵 **Qarz berish jarayoni** – tovar yoki xizmatni muddatli to‘lov asosida berish.  
- 📊 **To‘lovlarni boshqarish** – bir oylik, ko‘p oylik va qisman (custom) to‘lovlar.  
- 🔎 **Qarz monitoringi** – to‘langan va qolgan summalarni kuzatish.  
- 📂 **Omonat / qarz tarixini yuritish**.  
- 📑 **Hisobotlar** – sotuvchi va mijoz uchun qulay ko‘rinishda.  

---

## ⚙️ O‘rnatish va ishga tushirish

```bash
# Reponi clone qiling
git clone https://github.com/abror-150/nasiya-savdo.git

# Loyihaga kiring
cd nasiya-savdo

# Paketlarni o‘rnating
npm install

# Ma’lumotlar bazasini migratsiya qiling
npx prisma migrate dev

# Loyihani ishga tushiring
npm run start:dev
