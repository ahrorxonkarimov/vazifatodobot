// api/bot.js — VazifaBot Webhook
// Majburiy obuna + Telefon raqam + Admin panel + Foydalanuvchi tracking

const BOT_TOKEN = process.env.BOT_TOKEN || '8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://vazifatodobot.vercel.app';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const ADMIN_ID = 5985723887;
const CHANNEL = '@AbdullohhKarimov';
const CHANNEL_LINK = 'https://t.me/AbdullohhKarimov';

// ===== HELPERS =====
async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function send(chatId, text, extra = {}) {
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

async function editMsg(chatId, msgId, text, extra = {}) {
  return tg('editMessageText', { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML', ...extra });
}

async function deleteMsg(chatId, msgId) {
  try { await tg('deleteMessage', { chat_id: chatId, message_id: msgId }); } catch {}
}

async function answer(cbId, text = '') {
  return tg('answerCallbackQuery', { callback_query_id: cbId, text, show_alert: !!text });
}

// ===== OBUNA TEKSHIRISH =====
async function checkSub(userId) {
  try {
    const r = await tg('getChatMember', { chat_id: CHANNEL, user_id: userId });
    if (!r.ok) return false;
    return ['creator', 'administrator', 'member'].includes(r.result.status);
  } catch { return false; }
}

function isAdmin(id) { return Number(id) === ADMIN_ID; }

// ===== OBUNA XABARI =====
async function askSubscribe(chatId) {
  await send(chatId,
    `⚠️ <b>Avval kanalga obuna bo'ling!</b>\n\n` +
    `📢 Botdan foydalanish uchun quyidagi kanalga\n` +
    `obuna bo'lishingiz <b>SHART</b>:\n\n` +
    `👉 ${CHANNEL}\n\n` +
    `✅ Obuna bo'lgach, pastdagi tugmani bosing:`,
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

// ===== TELEFON RAQAM SO'RASH =====
async function askPhone(chatId, firstName) {
  await send(chatId,
    `📱 <b>${firstName}</b>, ro'yxatdan o'tish uchun\n` +
    `telefon raqamingizni yuboring.\n\n` +
    `👇 Pastdagi tugmani bosing:`,
    {
      reply_markup: {
        keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }
  );
}

// ===== XUSH KELIBSIZ XABARI =====
async function sendWelcome(chatId, user) {
  const name = user.first_name || 'Foydalanuvchi';
  const link = `${WEBAPP_URL}/index.html?tid=${user.id}&name=${encodeURIComponent(name)}`;
  const badge = isAdmin(user.id) ? '\n\n👑 <b>Siz adminsiz!</b> /admin — boshqaruv paneli' : '';

  await send(chatId,
    `✅ <b>Ro'yxatdan o'tdingiz!</b>\n\n` +
    `👋 Xush kelibsiz, <b>${name}</b>!\n\n` +
    `📚 <b>VazifaBot</b> — vazifalaringizni oson boshqaring:\n\n` +
    `├ ✅ Vazifa qo'shish va bajarish\n` +
    `├ 📅 Deadline va eslatmalar\n` +
    `├ 🏷️ Kategoriyalar\n` +
    `├ ⭐ Muhimlik darajasi\n` +
    `├ 📊 Progress bar\n` +
    `├ 🔍 Qidiruv va saralash\n` +
    `└ 🌙 Dark/Light rejim\n\n` +
    `🔗 <b>Ilova havolasi:</b>\n${link}` +
    badge,
    {
      reply_markup: { remove_keyboard: true }
    }
  );
}

// ===== ADMINGA YANGI USER HAQIDA XABAR =====
async function notifyAdmin(user, phone) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const uname = user.username ? `@${user.username}` : 'yo\'q';
  const lang = user.language_code || '—';
  const now = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  await send(ADMIN_ID,
    `┌─────────────────────┐\n` +
    `│  🆕 <b>YANGI FOYDALANUVCHI</b>  │\n` +
    `└─────────────────────┘\n\n` +
    `👤 <b>Ism:</b> ${fullName}\n` +
    `📱 <b>Telefon:</b> <code>${phone}</code>\n` +
    `🔗 <b>Username:</b> ${uname}\n` +
    `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
    `🌐 <b>Til:</b> ${lang}\n` +
    `🕐 <b>Sana:</b> ${now}\n\n` +
    `📨 Xabar yuborish: /msg_${user.id}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📨 Xabar yuborish', callback_data: `msg_${user.id}` }],
          [{ text: '👤 Profilni ko\'rish', url: `tg://user?id=${user.id}` }]
        ]
      }
    }
  );
}

// ===== ADMIN PANEL =====
async function showAdminPanel(chatId) {
  await send(chatId,
    `👑 <b>ADMIN BOSHQARUV PANELI</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Quyidagi tugmalardan birini tanlang:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Bot holati', callback_data: 'ap_status' }],
          [{ text: '🔗 Webhook sozlash', callback_data: 'ap_webhook' }],
          [{ text: '📢 Xabar yuborish (broadcast)', callback_data: 'ap_broadcast_help' }],
          [{ text: '🌐 Web App ochish', url: WEBAPP_URL }]
        ]
      }
    }
  );
}

// ========== MAIN HANDLER ==========
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, msg: 'VazifaBot active' });
  }

  try {
    const body = req.body;

    // ===== CALLBACK QUERY =====
    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId = cq.message.chat.id;
      const userId = cq.from.id;
      const data = cq.data;
      const msgId = cq.message.message_id;

      // -- Obuna tekshirish --
      if (data === 'check_sub') {
        const sub = await checkSub(userId);
        if (sub) {
          await answer(cq.id, '✅ Obuna tasdiqlandi!');
          await deleteMsg(chatId, msgId);
          await askPhone(chatId, cq.from.first_name);
        } else {
          await answer(cq.id, '❌ Siz hali obuna bo\'lmagansiz!\nAvval kanalga obuna bo\'ling.');
        }
        return res.status(200).json({ ok: true });
      }

      // -- Admin: Bot holati --
      if (data === 'ap_status' && isAdmin(userId)) {
        await answer(cq.id);
        const me = await tg('getMe', {});
        const wh = await tg('getWebhookInfo', {});
        const bot = me.result || {};
        const hook = wh.result || {};

        await editMsg(chatId, msgId,
          `👑 <b>ADMIN PANEL — Bot Holati</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🤖 <b>Bot:</b> @${bot.username}\n` +
          `🆔 <b>ID:</b> <code>${bot.id}</code>\n` +
          `📛 <b>Ism:</b> ${bot.first_name}\n\n` +
          `🌐 <b>Webhook:</b>\n` +
          `├ URL: <code>${hook.url || 'yo\'q'}</code>\n` +
          `├ Kutilayotgan: ${hook.pending_update_count || 0}\n` +
          `├ Xato: ${hook.last_error_message || 'yo\'q ✅'}\n` +
          `└ Ulanishlar: ${hook.max_connections || '—'}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Orqaga', callback_data: 'ap_back' }]
              ]
            }
          }
        );
        return res.status(200).json({ ok: true });
      }

      // -- Admin: Webhook --
      if (data === 'ap_webhook' && isAdmin(userId)) {
        await answer(cq.id);
        const whUrl = `${WEBAPP_URL}/api/bot`;
        const r = await tg('setWebhook', { url: whUrl });

        await editMsg(chatId, msgId,
          `👑 <b>ADMIN PANEL — Webhook</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          (r.ok
            ? `✅ <b>Webhook muvaffaqiyatli sozlandi!</b>\n\n🔗 <code>${whUrl}</code>`
            : `❌ <b>Xatolik:</b>\n<code>${JSON.stringify(r)}</code>`),
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Orqaga', callback_data: 'ap_back' }]
              ]
            }
          }
        );
        return res.status(200).json({ ok: true });
      }

      // -- Admin: Broadcast help --
      if (data === 'ap_broadcast_help' && isAdmin(userId)) {
        await answer(cq.id);
        await editMsg(chatId, msgId,
          `👑 <b>ADMIN PANEL — Xabar Yuborish</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📢 <b>Bitta foydalanuvchiga xabar:</b>\n` +
          `Quyidagi formatda yozing:\n\n` +
          `<code>/msg TELEGRAM_ID xabar matni</code>\n\n` +
          `<b>Misol:</b>\n` +
          `<code>/msg 123456789 Salom, qalaysiz?</code>\n\n` +
          `💡 Har bir yangi foydalanuvchi haqida kelgan\n` +
          `xabarda tayyor <b>"📨 Xabar yuborish"</b>\ntugmasi bor.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Orqaga', callback_data: 'ap_back' }]
              ]
            }
          }
        );
        return res.status(200).json({ ok: true });
      }

      // -- Admin: Orqaga --
      if (data === 'ap_back' && isAdmin(userId)) {
        await answer(cq.id);
        await editMsg(chatId, msgId,
          `👑 <b>ADMIN BOSHQARUV PANELI</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Quyidagi tugmalardan birini tanlang:`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📊 Bot holati', callback_data: 'ap_status' }],
                [{ text: '🔗 Webhook sozlash', callback_data: 'ap_webhook' }],
                [{ text: '📢 Xabar yuborish (broadcast)', callback_data: 'ap_broadcast_help' }],
                [{ text: '🌐 Web App ochish', url: WEBAPP_URL }]
              ]
            }
          }
        );
        return res.status(200).json({ ok: true });
      }

      // -- Admin: Foydalanuvchiga xabar yuborish callback --
      if (data.startsWith('msg_') && isAdmin(userId)) {
        const targetId = data.replace('msg_', '');
        await answer(cq.id);
        await send(chatId,
          `📨 <b>Xabar yuborish</b>\n\n` +
          `Foydalanuvchiga (<code>${targetId}</code>) xabar yuborish uchun:\n\n` +
          `<code>/msg ${targetId} Sizning xabaringiz</code>`
        );
        return res.status(200).json({ ok: true });
      }

      // -- Help callback --
      if (data === 'help') {
        await answer(cq.id);
        await send(chatId,
          `❓ <b>Yordam</b>\n\n` +
          `/start — Botni boshlash\n` +
          `/app — Ilova havolasi\n` +
          `/help — Yordam\n` +
          `/about — Bot haqida`
        );
        return res.status(200).json({ ok: true });
      }

      await answer(cq.id);
      return res.status(200).json({ ok: true });
    }

    // ===== MESSAGE =====
    const msg = body?.message;
    if (!msg) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const user = msg.from || {};
    const text = msg.text || '';

    // -- CONTACT (telefon raqam) --
    if (msg.contact) {
      const phone = msg.contact.phone_number || 'noma\'lum';
      // Adminga xabar
      await notifyAdmin(user, phone);
      // Foydalanuvchiga xush kelibsiz
      await sendWelcome(chatId, user);
      return res.status(200).json({ ok: true });
    }

    // -- /start --
    if (text.startsWith('/start')) {
      const sub = await checkSub(userId);
      if (!sub) {
        await askSubscribe(chatId);
      } else {
        await askPhone(chatId, user.first_name || 'Foydalanuvchi');
      }
      return res.status(200).json({ ok: true });
    }

    // -- /app --
    if (text === '/app') {
      const sub = await checkSub(userId);
      if (!sub) return askSubscribe(chatId);
      const name = user.first_name || 'Foydalanuvchi';
      const link = `${WEBAPP_URL}/index.html?tid=${userId}&name=${encodeURIComponent(name)}`;
      await send(chatId, `🔗 <b>Ilova havolasi:</b>\n${link}`);
      return res.status(200).json({ ok: true });
    }

    // -- /help --
    if (text === '/help') {
      await send(chatId,
        `❓ <b>Yordam</b>\n\n/start — Boshlash\n/app — Ilovani ochish\n/about — Bot haqida`
      );
      return res.status(200).json({ ok: true });
    }

    // -- /about --
    if (text === '/about') {
      await send(chatId,
        `📚 <b>VazifaBot</b>\n\nTalabalar uchun vazifa boshqaruvchi.\n\n` +
        `🌐 @vazifatodobot\n💻 HTML, CSS, JS\n☁️ Vercel`
      );
      return res.status(200).json({ ok: true });
    }

    // -- /admin --
    if (text === '/admin') {
      if (!isAdmin(userId)) {
        await send(chatId, '⛔ Sizda admin huquqi yo\'q.');
        return res.status(200).json({ ok: true });
      }
      await showAdminPanel(chatId);
      return res.status(200).json({ ok: true });
    }

    // -- /msg TARGET_ID xabar --
    if (text.startsWith('/msg') && isAdmin(userId)) {
      const parts = text.split(' ');
      if (parts.length < 3) {
        await send(chatId, `📨 <b>Format:</b>\n<code>/msg TELEGRAM_ID xabar matni</code>`);
        return res.status(200).json({ ok: true });
      }
      const targetId = parts[1];
      const message = parts.slice(2).join(' ');
      try {
        await send(targetId, `📨 <b>Admin xabari:</b>\n\n${message}`);
        await send(chatId, `✅ Xabar <code>${targetId}</code> ga yuborildi!`);
      } catch {
        await send(chatId, `❌ Xabar yuborib bo'lmadi. ID: <code>${targetId}</code>`);
      }
      return res.status(200).json({ ok: true });
    }

    // -- Noma'lum xabar --
    if (text && !text.startsWith('/')) {
      await send(chatId, `💡 /start yuboring botdan foydalanish uchun.`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Bot error:', err);
    return res.status(200).json({ ok: true, error: err.message });
  }
};
