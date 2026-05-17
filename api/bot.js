// api/bot.js — Vercel Serverless Function (CommonJS format)
// Telegram Bot Webhook handler

const BOT_TOKEN = process.env.BOT_TOKEN || '8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://vazifatodobot.vercel.app';
const API_BASE   = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendRequest(method, body) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId, text, extra = {}) {
  return sendRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'VazifaBot webhook is active!' });
  }

  try {
    const body = req.body;
    const msg  = body?.message || body?.callback_query?.message;
    if (!msg) return res.status(200).json({ ok: true });

    const chatId   = msg.chat.id;
    const userId   = msg.from?.id;
    const userName = msg.from?.first_name || 'Foydalanuvchi';
    const text     = msg.text || '';

    // ---- /start ----
    if (text.startsWith('/start')) {
      const encodedName = encodeURIComponent(userName);
      const appLink = `${WEBAPP_URL}/index.html?tid=${userId}&name=${encodedName}`;

      await sendMessage(chatId,
        `👋 <b>Assalomu alaykum, ${userName}!</b>\n\n` +
        `📚 <b>VazifaBot</b> — talabalar uchun aqlli vazifa boshqaruvchi!\n\n` +
        `🎯 <b>Imkoniyatlar:</b>\n` +
        `• ✅ Vazifalar ro'yxati\n` +
        `• 📅 Deadline va eslatmalar\n` +
        `• 🏷️ Kategoriyalar\n` +
        `• ⭐ Muhimlik darajasi\n` +
        `• 📊 Progress kuzatuvi\n` +
        `• 🌙 Dark/Light rejim\n\n` +
        `Telegram ID'ingiz: <code>${userId}</code>\n\n` +
        `👇 <b>Pastdagi tugmani bosing va boshlang!</b>`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🚀 Ilovani ochish',
                url: appLink,
              }
            ],[
              {
                text: '❓ Yordam',
                callback_data: 'help'
              },
              {
                text: '📊 Haqida',
                callback_data: 'about'
              }
            ]]
          }
        }
      );
    }

    // ---- /help ----
    else if (text === '/help') {
      await sendMessage(chatId,
        `❓ <b>Yordam</b>\n\n` +
        `<b>Asosiy buyruqlar:</b>\n` +
        `/start — Botni boshlash\n` +
        `/help — Yordam\n` +
        `/app — Ilovani ochish\n` +
        `/about — Bot haqida\n\n` +
        `<b>Ilova imkoniyatlari:</b>\n` +
        `➕ Vazifa qo'shish — matn kiritib Enter\n` +
        `✅ Bajarildi — checkbox bosing\n` +
        `✏️ Tahrirlash — karandash tugmasini bosing\n` +
        `🗑️ O'chirish — savat tugmasini bosing\n` +
        `📅 Deadline — qo'shimcha imkoniyatlar bo'limida\n` +
        `🔔 Eslatma — brauzer xabarnomasi\n` +
        `🌙 Dark mode — yon paneldagi sozlamalar\n\n` +
        `💡 <i>Ctrl+K bilan tezkor qidiruv!</i>`
      );
    }

    // ---- /app ----
    else if (text === '/app') {
      const encodedName = encodeURIComponent(userName);
      const appLink = `${WEBAPP_URL}/index.html?tid=${userId}&name=${encodedName}`;
      await sendMessage(chatId,
        `📱 <b>Ilovaga o'tish uchun tugmani bosing:</b>`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀 VazifaBot ilovasini ochish', url: appLink }
            ]]
          }
        }
      );
    }

    // ---- /about ----
    else if (text === '/about') {
      await sendMessage(chatId,
        `📚 <b>VazifaBot haqida</b>\n\n` +
        `VazifaBot — O'zbekiston talabalari uchun yaratilgan\n` +
        `zamonaviy vazifa boshqaruvchi ilovasi.\n\n` +
        `🌐 <b>Bot:</b> @vazifatodobot\n` +
        `💻 <b>Texnologiyalar:</b> HTML, CSS, JavaScript\n` +
        `☁️ <b>Hosting:</b> Vercel\n` +
        `📦 <b>Saqlash:</b> LocalStorage\n\n` +
        `❤️ <i>Talabalar uchun, talabalar tomonidan!</i>`
      );
    }

    // ---- Callback queries ----
    else if (body.callback_query) {
      const cq   = body.callback_query;
      const data = cq.data;

      if (data === 'help') {
        await sendRequest('answerCallbackQuery', { callback_query_id: cq.id });
        await sendMessage(chatId,
          `❓ <b>Yordam</b>\n\n/help buyrug'ini yuboring batafsil ma'lumot uchun.`
        );
      } else if (data === 'about') {
        await sendRequest('answerCallbackQuery', { callback_query_id: cq.id });
        await sendMessage(chatId,
          `📚 <b>VazifaBot</b> — Talabalar uchun aqlli vazifa boshqaruvchi!\n` +
          `Bot: @vazifatodobot`
        );
      } else {
        await sendRequest('answerCallbackQuery', { callback_query_id: cq.id });
      }
    }

    // ---- Unknown ----
    else if (text && !text.startsWith('/')) {
      await sendMessage(chatId,
        `💡 Ilovaga kirish uchun /start yuboring!\n` +
        `Yordam uchun /help`
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Bot error:', err);
    return res.status(200).json({ ok: true, error: err.message });
  }
};
