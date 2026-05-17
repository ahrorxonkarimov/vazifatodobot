// api/bot.js — Vercel Serverless Function
// VazifaBot Webhook — Admin panel + Majburiy obuna + Foydalanuvchi tracking

const BOT_TOKEN = process.env.BOT_TOKEN || '8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://vazifatodobot.vercel.app';
const API_BASE   = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ---- ADMIN & CHANNEL CONFIG ----
const ADMIN_ID     = 5985723887;
const CHANNEL_USERNAME = '@AbdullohhKarimov';
const CHANNEL_LINK     = 'https://t.me/AbdullohhKarimov';

// ---- Helpers ----
async function tg(method, body) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function send(chatId, text, extra = {}) {
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

async function answer(callbackId, text = '') {
  return tg('answerCallbackQuery', { callback_query_id: callbackId, text, show_alert: !!text });
}

// ---- Obuna tekshirish ----
async function isSubscribed(userId) {
  try {
    const res = await tg('getChatMember', { chat_id: CHANNEL_USERNAME, user_id: userId });
    if (res.ok) {
      const status = res.result.status;
      return ['creator', 'administrator', 'member'].includes(status);
    }
    return false;
  } catch { return false; }
}

function isAdmin(userId) {
  return Number(userId) === ADMIN_ID;
}

// ---- Obuna bo'lmagan foydalanuvchiga xabar ----
async function sendSubscribeMsg(chatId) {
  await send(chatId,
    `⚠️ <b>Avval kanalga obuna bo'ling!</b>\n\n` +
    `📢 Ilovadan foydalanish uchun quyidagi kanalga obuna bo'lishingiz shart:\n\n` +
    `👉 <b>${CHANNEL_USERNAME}</b>\n\n` +
    `Obuna bo'lgach, <b>✅ Tekshirish</b> tugmasini bosing.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Kanalga o\'tish', url: CHANNEL_LINK }],
          [{ text: '✅ Obunani tekshirish', callback_data: 'check_sub' }]
        ]
      }
    }
  );
}

// ---- Adminga yangi foydalanuvchi haqida xabar ----
async function notifyAdmin(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const username = user.username ? `@${user.username}` : '—';
  const lang = user.language_code || '—';
  const time = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  await send(ADMIN_ID,
    `🆕 <b>Yangi foydalanuvchi!</b>\n\n` +
    `👤 <b>Ism:</b> ${name}\n` +
    `🔗 <b>Username:</b> ${username}\n` +
    `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
    `🌐 <b>Til:</b> ${lang}\n` +
    `🕐 <b>Vaqt:</b> ${time}\n` +
    `━━━━━━━━━━━━━━━━━━━━━`
  );
}

// ---- Start xabari ----
async function handleStart(chatId, user) {
  // Adminga xabar
  if (!isAdmin(user.id)) {
    notifyAdmin(user); // async, kutmaymiz
  }

  // Obuna tekshirish
  const subscribed = await isSubscribed(user.id);
  if (!subscribed) {
    return sendSubscribeMsg(chatId);
  }

  // Web app link
  const encodedName = encodeURIComponent(user.first_name || 'Foydalanuvchi');
  const appLink = `${WEBAPP_URL}/index.html?tid=${user.id}&name=${encodedName}`;

  const adminBadge = isAdmin(user.id) ? '\n👑 <b>Siz adminsiz!</b> /admin — Boshqaruv paneli' : '';

  await send(chatId,
    `👋 <b>Assalomu alaykum, ${user.first_name}!</b>\n\n` +
    `📚 <b>VazifaBot</b> — talabalar uchun aqlli vazifa boshqaruvchi!\n\n` +
    `🎯 <b>Imkoniyatlar:</b>\n` +
    `├ ✅ Vazifalar ro'yxati\n` +
    `├ 📅 Deadline va eslatmalar\n` +
    `├ 🏷️ Kategoriyalar\n` +
    `├ ⭐ Muhimlik darajasi (1-5)\n` +
    `├ 📊 Progress kuzatuvi\n` +
    `├ 🌙 Dark/Light rejim\n` +
    `├ 🔍 Qidiruv va saralash\n` +
    `└ 🔔 Brauzer eslatmalari\n\n` +
    `🆔 Telegram ID: <code>${user.id}</code>` +
    adminBadge + `\n\n` +
    `👇 <b>Pastdagi tugmani bosib boshlang!</b>`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Ilovani ochish', url: appLink }],
          [{ text: '📢 Kanal', url: CHANNEL_LINK }, { text: '❓ Yordam', callback_data: 'help' }]
        ]
      }
    }
  );
}

// ---- Admin Panel ----
async function handleAdmin(chatId, userId) {
  if (!isAdmin(userId)) {
    return send(chatId, '⛔ Sizda admin huquqi yo\'q.');
  }

  await send(chatId,
    `👑 <b>ADMIN PANEL</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🔧 <b>Buyruqlar:</b>\n\n` +
    `📊 /stats — Bot statistikasi\n` +
    `📢 /broadcast — Xabar yuborish (javob)\n` +
    `🔗 /setwebhook — Webhookni sozlash\n` +
    `📋 /botinfo — Bot haqida ma'lumot\n` +
    `🔄 /checkbot — Bot holatini tekshirish\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 <i>Broadcast: Istalgan xabarga javob (reply) qilib /broadcast yozing — barcha foydalanuvchilarga yuboriladi.</i>`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Statistika', callback_data: 'admin_stats' }, { text: '📋 Bot info', callback_data: 'admin_botinfo' }],
          [{ text: '🔗 Webhook sozlash', callback_data: 'admin_webhook' }],
          [{ text: '🚀 Web App ochish', url: WEBAPP_URL }]
        ]
      }
    }
  );
}

// ---- Webhook sozlash ----
async function handleSetWebhook(chatId, userId) {
  if (!isAdmin(userId)) return;
  const webhookUrl = `${WEBAPP_URL}/api/bot`;
  const res = await tg('setWebhook', { url: webhookUrl });
  if (res.ok) {
    await send(chatId,
      `✅ <b>Webhook muvaffaqiyatli sozlandi!</b>\n\n` +
      `🔗 URL: <code>${webhookUrl}</code>`
    );
  } else {
    await send(chatId,
      `❌ <b>Webhook xatosi:</b>\n<code>${JSON.stringify(res)}</code>`
    );
  }
}

// ---- Bot info ----
async function handleBotInfo(chatId, userId) {
  if (!isAdmin(userId)) return;
  const me = await tg('getMe', {});
  const wh = await tg('getWebhookInfo', {});
  const bot = me.result || {};
  const hook = wh.result || {};

  await send(chatId,
    `🤖 <b>Bot Ma'lumotlari</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Ism:</b> ${bot.first_name || '—'}\n` +
    `🔗 <b>Username:</b> @${bot.username || '—'}\n` +
    `🆔 <b>Bot ID:</b> <code>${bot.id || '—'}</code>\n` +
    `📥 <b>Inline:</b> ${bot.supports_inline_queries ? '✅' : '❌'}\n\n` +
    `🌐 <b>Webhook:</b>\n` +
    `├ URL: <code>${hook.url || 'O\'rnatilmagan'}</code>\n` +
    `├ Kutilayotgan: ${hook.pending_update_count || 0}\n` +
    `├ Oxirgi xato: ${hook.last_error_message || 'Yo\'q'}\n` +
    `└ Max ulanishlar: ${hook.max_connections || '—'}`
  );
}

// ========== MAIN HANDLER ==========
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'VazifaBot webhook is active! 🚀' });
  }

  try {
    const body = req.body;

    // ---- Callback query ----
    if (body.callback_query) {
      const cq     = body.callback_query;
      const chatId = cq.message.chat.id;
      const userId = cq.from.id;
      const data   = cq.data;

      // Obuna tekshirish
      if (data === 'check_sub') {
        const subscribed = await isSubscribed(userId);
        if (subscribed) {
          await answer(cq.id, '✅ Obuna tasdiqlandi!');
          // Eski xabarni o'chirish
          try { await tg('deleteMessage', { chat_id: chatId, message_id: cq.message.message_id }); } catch {}
          // Start xabarini yuborish
          await handleStart(chatId, cq.from);
        } else {
          await answer(cq.id, '❌ Siz hali obuna bo\'lmagansiz! Avval kanalga obuna bo\'ling.');
        }
        return res.status(200).json({ ok: true });
      }

      // Help
      if (data === 'help') {
        await answer(cq.id);
        await send(chatId,
          `❓ <b>Yordam</b>\n\n` +
          `<b>Buyruqlar:</b>\n` +
          `/start — Botni boshlash\n` +
          `/help — Yordam\n` +
          `/app — Ilovani ochish\n` +
          `/about — Bot haqida\n\n` +
          `<b>Ilova imkoniyatlari:</b>\n` +
          `➕ Vazifa qo'shish — matn kiritib Enter\n` +
          `✅ Bajarildi — checkbox bosing\n` +
          `✏️ Tahrirlash — qalamcha bosing\n` +
          `🗑️ O'chirish — savat bosing\n` +
          `📅 Deadline — qo'shimcha imkoniyatlarda\n` +
          `🔔 Eslatma — brauzer xabarnomasi\n` +
          `🌙 Dark mode — yon panel sozlamalari\n\n` +
          `💡 <i>Ctrl+K = tezkor qidiruv!</i>`
        );
        return res.status(200).json({ ok: true });
      }

      // Admin callbacks
      if (data === 'admin_stats') {
        await answer(cq.id);
        await handleBotInfo(chatId, userId);
        return res.status(200).json({ ok: true });
      }
      if (data === 'admin_botinfo') {
        await answer(cq.id);
        await handleBotInfo(chatId, userId);
        return res.status(200).json({ ok: true });
      }
      if (data === 'admin_webhook') {
        await answer(cq.id);
        await handleSetWebhook(chatId, userId);
        return res.status(200).json({ ok: true });
      }

      // About
      if (data === 'about') {
        await answer(cq.id);
        await send(chatId,
          `📚 <b>VazifaBot</b> — Talabalar uchun aqlli vazifa boshqaruvchi!\nBot: @vazifatodobot`
        );
        return res.status(200).json({ ok: true });
      }

      await answer(cq.id);
      return res.status(200).json({ ok: true });
    }

    // ---- Message ----
    const msg = body?.message;
    if (!msg) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const user   = msg.from || {};
    const text   = msg.text || '';

    // /start
    if (text.startsWith('/start')) {
      await handleStart(chatId, user);
    }

    // /help
    else if (text === '/help') {
      await send(chatId,
        `❓ <b>Yordam</b>\n\n/start — Botni boshlash\n/app — Ilovani ochish\n/help — Yordam\n/about — Bot haqida`
      );
    }

    // /app
    else if (text === '/app') {
      const sub = await isSubscribed(userId);
      if (!sub) return sendSubscribeMsg(chatId);

      const encodedName = encodeURIComponent(user.first_name || 'Foydalanuvchi');
      const appLink = `${WEBAPP_URL}/index.html?tid=${userId}&name=${encodedName}`;
      await send(chatId, `📱 <b>Ilovaga o'tish:</b>`, {
        reply_markup: { inline_keyboard: [[{ text: '🚀 Ilovani ochish', url: appLink }]] }
      });
    }

    // /about
    else if (text === '/about') {
      await send(chatId,
        `📚 <b>VazifaBot haqida</b>\n\nTalabalar uchun zamonaviy vazifa boshqaruvchi.\n\n` +
        `🌐 Bot: @vazifatodobot\n💻 Stack: HTML, CSS, JS\n☁️ Hosting: Vercel\n\n❤️ <i>Talabalar uchun!</i>`
      );
    }

    // /admin
    else if (text === '/admin') {
      await handleAdmin(chatId, userId);
    }

    // /setwebhook
    else if (text === '/setwebhook') {
      await handleSetWebhook(chatId, userId);
    }

    // /botinfo
    else if (text === '/botinfo') {
      await handleBotInfo(chatId, userId);
    }

    // /broadcast (reply to message)
    else if (text === '/broadcast' && isAdmin(userId)) {
      if (!msg.reply_to_message) {
        await send(chatId,
          `📢 <b>Broadcast</b>\n\nXabar yuborish uchun biror xabarga <b>javob (reply)</b> qilib /broadcast yozing.`
        );
      } else {
        await send(chatId, `📢 <b>Broadcast yuborilmoqda...</b>\n\n⚠️ <i>Eslatma: Serverless muhitda barcha foydalanuvchilar ro'yxati saqlanmaydi. Broadcast funksiyasi to'liq ishlashi uchun ma'lumotlar bazasi kerak.</i>`);
      }
    }

    // /checkbot
    else if (text === '/checkbot' && isAdmin(userId)) {
      const me = await tg('getMe', {});
      if (me.ok) {
        await send(chatId, `✅ <b>Bot ishlayapti!</b>\n\n🤖 @${me.result.username}\n🆔 ${me.result.id}`);
      } else {
        await send(chatId, `❌ <b>Bot bilan muammo:</b>\n<code>${JSON.stringify(me)}</code>`);
      }
    }

    // Unknown
    else if (text && !text.startsWith('/')) {
      await send(chatId, `💡 Botdan foydalanish uchun /start yuboring!`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Bot error:', err);
    return res.status(200).json({ ok: true, error: err.message });
  }
};
