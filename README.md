# 📚 VazifaBot — Talaba To-Do List

O'zbekiston talabalari uchun yaratilgan zamonaviy vazifa boshqaruvchi web ilovasi. Telegram bot orqali tezkor kirish.

🔗 **Bot:** [@vazifatodobot](https://t.me/vazifatodobot)

---

## ✨ Imkoniyatlar

| Funksiya | Tavsif |
|----------|--------|
| ✅ Vazifalar | Qo'shish, o'chirish, tahrirlash |
| 📅 Deadline | Muddat belgilash + qizil ogohlantirish |
| 🏷️ Kategoriya | Dars, Sport, Uy ishi, Shaxsiy |
| ⭐ Muhimlik | 1-5 yulduz baholash |
| 📊 Progress | Foizda bajarilganlik |
| 🔔 Eslatma | Brauzer notification |
| 🌙 Dark Mode | Tungi va kunduzgi rejim |
| 🔍 Qidiruv | Ctrl+K bilan tezkor |
| 🗂️ Saralash | Yangi/Muddat/Muhimlik/Alifbo |
| 🎨 Rang | Vazifa va brand rangi |
| 💾 LocalStorage | Brauzerni yopsang ham saqlanadi |
| 📤 Export | JSON formatida yuklab olish |

---

## 🚀 Ishga tushirish

### 1. Telegram bot orqali kirish
1. [@vazifatodobot](https://t.me/vazifatodobot) ga kiring
2. `/start` bosing
3. "Ilovani ochish" tugmasini bosing

### 2. To'g'ridan ochish
Saytga kiring va "Mehmon sifatida kirish" tugmasini bosing.

---

## 🛠️ Deployment (Vercel)

### 1. GitHub'ga yuklash
```bash
git clone https://github.com/ahrorxonkarimov/vazifatodobot.git
cd vazifatodobot
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel'ga ulash
1. [vercel.com](https://vercel.com) ga kiring
2. "New Project" → GitHub repo'ni tanlang
3. Environment variables qo'shing:
   - `BOT_TOKEN` = `8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA`
   - `WEBAPP_URL` = `https://your-app.vercel.app`
4. Deploy!

### 3. Webhook sozlash
Deploy bo'lgandan keyin brauzerda ochish:
```
https://api.telegram.org/bot8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA/setWebhook?url=https://your-app.vercel.app/api/bot
```

---

## 📁 Fayl tuzilmasi

```
├── index.html       # Login sahifasi
├── app.html         # Asosiy ilova
├── style.css        # Global CSS
├── app.css          # Ilova CSS
├── app.js           # JavaScript logika
├── api/
│   └── bot.js       # Telegram bot webhook
├── vercel.json      # Vercel konfiguratsiya
└── README.md
```

---

## 🤖 Bot buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni boshlash + ilovaga link |
| `/app` | Ilovani ochish |
| `/help` | Yordam |
| `/about` | Bot haqida |

---

## 💻 Texnologiyalar

- **Frontend:** HTML5, Vanilla CSS, Vanilla JavaScript
- **Saqlash:** LocalStorage
- **Auth:** Telegram Bot API
- **Backend:** Vercel Serverless Functions (Node.js)
- **Hosting:** Vercel
- **Font:** Inter + Nunito (Google Fonts)

---

❤️ *Talabalar uchun, talabalar tomonidan!*
