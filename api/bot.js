const BOT_TOKEN = process.env.BOT_TOKEN || '8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://vazifatodobot.vercel.app';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ADMIN_ID = 5985723887;
const CHANNEL = '@AbdullohhKarimov';
const CHANNEL_LINK = 'https://t.me/AbdullohhKarimov';

async function tg(m, b) {
  const r = await fetch(`${API}/${m}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(b) });
  return r.json();
}
async function send(c, t, e={}) { return tg('sendMessage', {chat_id:c, text:t, parse_mode:'HTML', ...e}); }
async function editMsg(c, m, t, e={}) { return tg('editMessageText', {chat_id:c, message_id:m, text:t, parse_mode:'HTML', ...e}); }
async function answer(id, t='') { return tg('answerCallbackQuery', {callback_query_id:id, text:t, show_alert:!!t}); }
async function del(c, m) { try{await tg('deleteMessage',{chat_id:c,message_id:m})}catch{} }

async function checkSub(uid) {
  try {
    const r = await tg('getChatMember', {chat_id:CHANNEL, user_id:uid});
    return r.ok && ['creator','administrator','member'].includes(r.result.status);
  } catch { return false; }
}

function isAdmin(id) { return Number(id) === ADMIN_ID; }

async function getPhoto(uid) {
  try {
    const r = await tg('getUserProfilePhotos', {user_id:uid, limit:1});
    if (r.ok && r.result.total_count > 0) {
      const fid = r.result.photos[0][0].file_id;
      const f = await tg('getFile', {file_id:fid});
      if (f.ok) return `https://api.telegram.org/file/bot${BOT_TOKEN}/${f.result.file_path}`;
    }
  } catch {}
  return null;
}

// ===== FLOW: /start → telefon → obuna → tayyor =====

async function askPhone(chatId, name) {
  await send(chatId,
    `👋 <b>Salom, ${name}!</b>\n\n📱 Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:`,
    { reply_markup: { keyboard:[[{text:'📱 Telefon raqamni yuborish', request_contact:true}]], resize_keyboard:true, one_time_keyboard:true } }
  );
}

async function askSubscribe(chatId) {
  await send(chatId,
    `📢 <b>Kanalga obuna bo'ling!</b>\n\nBotdan foydalanish uchun kanalga obuna bo'ling:\n👉 ${CHANNEL}`,
    { reply_markup: { inline_keyboard:[ [{text:'📢 Kanalga o\'tish', url:CHANNEL_LINK}], [{text:'✅ Tekshirish', callback_data:'check_sub'}] ] } }
  );
}

async function sendWelcome(chatId, user) {
  const badge = isAdmin(user.id) ? '\n👑 <b>Admin rejimi:</b> /admin' : '';
  await send(chatId,
    `✅ <b>Muvaffaqiyatli ro'yxatdan o'tdingiz!</b>\n\n` +
    `📚 <b>VazifaBot</b> tayyor!\n` +
    `Vazifalaringizni boshqarish uchun\npastdagi menyu tugmalaridan foydalaning.` + badge,
    { reply_markup: { keyboard: [
      [{text:'📋 Vazifalarim'}, {text:'📊 Statistika'}],
      [{text:'👤 Profilim'}, {text:'⚙️ Sozlamalar'}],
      [{text:'❓ Yordam'}]
    ], resize_keyboard:true } }
  );
}

async function notifyAdmin(user, phone) {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const uname = user.username ? `@${user.username}` : 'yo\'q';
  const now = new Date().toLocaleString('uz-UZ', {timeZone:'Asia/Tashkent'});
  const photo = await getPhoto(user.id);

  const text = `🆕 <b>YANGI FOYDALANUVCHI</b>\n━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Ism:</b> ${full}\n` +
    `📱 <b>Tel:</b> <code>${phone}</code>\n` +
    `🔗 <b>Username:</b> ${uname}\n` +
    `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
    `🌐 <b>Til:</b> ${user.language_code||'—'}\n` +
    `🕐 <b>Sana:</b> ${now}`;

  if (photo) {
    await tg('sendPhoto', { chat_id:ADMIN_ID, photo, caption:text, parse_mode:'HTML',
      reply_markup:{inline_keyboard:[[{text:'📨 Xabar',callback_data:`msg_${user.id}`},{text:'👤 Profil',url:`tg://user?id=${user.id}`}]]}
    });
  } else {
    await send(ADMIN_ID, text, {reply_markup:{inline_keyboard:[[{text:'📨 Xabar',callback_data:`msg_${user.id}`},{text:'👤 Profil',url:`tg://user?id=${user.id}`}]]}});
  }
}

// ===== ADMIN PANEL =====
async function adminPanel(chatId, msgId) {
  const t = `👑 <b>ADMIN PANEL</b>\n━━━━━━━━━━━━━━━\n\nTugmalardan birini tanlang:`;
  const kb = {inline_keyboard:[
    [{text:'👥 Foydalanuvchilar', callback_data:'ap_users'}],
    [{text:'📢 Reklama joylash', callback_data:'ap_ad'}],
    [{text:'📊 So\'rovnoma', callback_data:'ap_poll'}],
    [{text:'📨 Xabar yuborish', callback_data:'ap_msg'}],
    [{text:'📋 Bot holati', callback_data:'ap_status'}]
  ]};
  if (msgId) await editMsg(chatId, msgId, t, {reply_markup:kb});
  else await send(chatId, t, {reply_markup:kb});
}

// ========== HANDLER ==========
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ok:true});

  try {
    const body = req.body;

    // === CALLBACK ===
    if (body.callback_query) {
      const cq = body.callback_query;
      const ch = cq.message.chat.id;
      const uid = cq.from.id;
      const d = cq.data;
      const mid = cq.message.message_id;

      if (d === 'check_sub') {
        if (await checkSub(uid)) {
          await answer(cq.id, '✅ Obuna tasdiqlandi!');
          await del(ch, mid);
          await sendWelcome(ch, cq.from);
        } else {
          await answer(cq.id, '❌ Avval kanalga obuna bo\'ling!');
        }
        return res.status(200).json({ok:true});
      }

      // Admin callbacks
      if (d === 'ap_back' && isAdmin(uid)) { await answer(cq.id); await adminPanel(ch, mid); return res.status(200).json({ok:true}); }

      if (d === 'ap_users' && isAdmin(uid)) {
        await answer(cq.id);
        await editMsg(ch, mid,
          `👑 <b>ADMIN — Foydalanuvchilar</b>\n━━━━━━━━━━━━━━━\n\n` +
          `Har bir yangi foydalanuvchi haqida\nto'liq ma'lumot sizga avtomatik keladi:\n\n` +
          `👤 Ism, 📱 Telefon, 🔗 Username\n🆔 ID, 📷 Profil rasmi\n\n` +
          `📨 Xabar yuborish:\n<code>/msg ID xabar matni</code>\n\n` +
          `🖼 Rasm bilan xabar:\nRasmga reply qilib <code>/msg ID</code>`,
          {reply_markup:{inline_keyboard:[[{text:'🔙 Orqaga',callback_data:'ap_back'}]]}}
        );
        return res.status(200).json({ok:true});
      }

      if (d === 'ap_ad' && isAdmin(uid)) {
        await answer(cq.id);
        await editMsg(ch, mid,
          `👑 <b>ADMIN — Reklama</b>\n━━━━━━━━━━━━━━━\n\n` +
          `📢 Reklama joylash uchun:\n\n` +
          `<code>/ad Reklama matni</code>\n\n` +
          `🖼 Rasmli reklama:\nRasmga reply qilib <code>/ad</code>\n\n` +
          `❌ Reklamani o'chirish:\n<code>/ad off</code>\n\n` +
          `💡 Reklama foydalanuvchilarning\nweb ilovasida ko'rinadi.`,
          {reply_markup:{inline_keyboard:[[{text:'🔙 Orqaga',callback_data:'ap_back'}]]}}
        );
        return res.status(200).json({ok:true});
      }

      if (d === 'ap_poll' && isAdmin(uid)) {
        await answer(cq.id);
        await editMsg(ch, mid,
          `👑 <b>ADMIN — So'rovnoma</b>\n━━━━━━━━━━━━━━━\n\n` +
          `📊 So'rovnoma yaratish:\n\n` +
          `<code>/poll Savol?\nVariant 1\nVariant 2\nVariant 3</code>\n\n` +
          `Birinchi qator — savol\nQolgan qatorlar — variantlar\n(kamida 2 ta variant kerak)`,
          {reply_markup:{inline_keyboard:[[{text:'🔙 Orqaga',callback_data:'ap_back'}]]}}
        );
        return res.status(200).json({ok:true});
      }

      if (d === 'ap_msg' && isAdmin(uid)) {
        await answer(cq.id);
        await editMsg(ch, mid,
          `👑 <b>ADMIN — Xabar Yuborish</b>\n━━━━━━━━━━━━━━━\n\n` +
          `📨 <b>Matnli xabar:</b>\n<code>/msg ID xabar matni</code>\n\n` +
          `🖼 <b>Rasmli xabar:</b>\nRasmga reply qilib <code>/msg ID</code>\n\n` +
          `💡 Har bir yangi foydalanuvchi xabarida\n📨 tugma bor — bosib xabar yuboring.`,
          {reply_markup:{inline_keyboard:[[{text:'🔙 Orqaga',callback_data:'ap_back'}]]}}
        );
        return res.status(200).json({ok:true});
      }

      if (d === 'ap_status' && isAdmin(uid)) {
        await answer(cq.id);
        const me = await tg('getMe',{});
        const wh = await tg('getWebhookInfo',{});
        const b = me.result||{}, h = wh.result||{};
        await editMsg(ch, mid,
          `👑 <b>ADMIN — Bot Holati</b>\n━━━━━━━━━━━━━━━\n\n` +
          `🤖 @${b.username}\n🆔 <code>${b.id}</code>\n\n` +
          `🌐 Webhook: ${h.url?'✅ Ulangan':'❌ Ulanmagan'}\n` +
          `📥 Kutilayotgan: ${h.pending_update_count||0}\n` +
          `⚠️ Xato: ${h.last_error_message||'yo\'q ✅'}`,
          {reply_markup:{inline_keyboard:[[{text:'🔙 Orqaga',callback_data:'ap_back'}]]}}
        );
        return res.status(200).json({ok:true});
      }

      if (d.startsWith('msg_') && isAdmin(uid)) {
        const tid = d.replace('msg_','');
        await answer(cq.id);
        await send(ch, `📨 Xabar yuborish:\n<code>/msg ${tid} xabar matni</code>`);
        return res.status(200).json({ok:true});
      }

      await answer(cq.id);
      return res.status(200).json({ok:true});
    }

    // === MESSAGE ===
    const msg = body?.message;
    if (!msg) return res.status(200).json({ok:true});
    const ch = msg.chat.id, uid = msg.from?.id, user = msg.from||{}, text = msg.text||'';

    // -- Contact --
    if (msg.contact) {
      const phone = msg.contact.phone_number||'noma\'lum';
      await notifyAdmin(user, phone);
      const sub = await checkSub(uid);
      if (!sub) { await askSubscribe(ch); }
      else { await sendWelcome(ch, user); }
      return res.status(200).json({ok:true});
    }

    // -- /start --
    if (text.startsWith('/start')) {
      await askPhone(ch, user.first_name||'Foydalanuvchi');
      return res.status(200).json({ok:true});
    }

    // -- Menyu tugmalari --
    if (text === '📋 Vazifalarim') {
      await send(ch, `📋 <b>Vazifalarim</b>\n\nVazifalaringiz web ilovada saqlanadi.\nIlovaga kirish uchun /app buyrug'ini yuboring.`);
      return res.status(200).json({ok:true});
    }
    if (text === '📊 Statistika') {
      await send(ch, `📊 <b>Statistika</b>\n\nBatafsil statistikani web ilovadagi\nyon paneldan ko'rishingiz mumkin.`);
      return res.status(200).json({ok:true});
    }
    if (text === '👤 Profilim') {
      const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
      const uname = user.username ? `@${user.username}` : 'yo\'q';
      const photo = await getPhoto(uid);
      const t = `👤 <b>Profilim</b>\n━━━━━━━━━━━━━━━\n\n` +
        `📛 <b>Ism:</b> ${full}\n🔗 <b>Username:</b> ${uname}\n🆔 <b>ID:</b> <code>${uid}</code>\n🌐 <b>Til:</b> ${user.language_code||'—'}`;
      if (photo) await tg('sendPhoto', {chat_id:ch, photo, caption:t, parse_mode:'HTML'});
      else await send(ch, t);
      return res.status(200).json({ok:true});
    }
    if (text === '⚙️ Sozlamalar') {
      await send(ch, `⚙️ <b>Sozlamalar</b>\n\nSozlamalarni web ilovaning\nyon panelidan o'zgartiring.\n\n🌙 Dark/Light rejim\n🎨 Rang tanlash\n🔔 Eslatmalar`);
      return res.status(200).json({ok:true});
    }
    if (text === '❓ Yordam') {
      await send(ch, `❓ <b>Yordam</b>\n\n/start — Qayta boshlash\n/app — Ilovaga kirish\n/about — Bot haqida\n\n📋 Vazifalarim — Vazifalar\n📊 Statistika — Statistika\n👤 Profilim — Profil\n⚙️ Sozlamalar — Sozlamalar`);
      return res.status(200).json({ok:true});
    }

    // -- /app --
    if (text === '/app') {
      const sub = await checkSub(uid);
      if (!sub) return askSubscribe(ch);
      const name = user.first_name||'';
      const link = `${WEBAPP_URL}/index.html?tid=${uid}&name=${encodeURIComponent(name)}`;
      await tg('sendMessage', {chat_id:ch, text:link});
      return res.status(200).json({ok:true});
    }

    // -- /about --
    if (text === '/about') {
      await send(ch, `📚 <b>VazifaBot</b>\n\nTalabalar uchun vazifa boshqaruvchi.\n🌐 @vazifatodobot`);
      return res.status(200).json({ok:true});
    }

    // -- /admin --
    if (text === '/admin') {
      if (!isAdmin(uid)) { await send(ch,'⛔ Admin huquqi yo\'q.'); return res.status(200).json({ok:true}); }
      await adminPanel(ch);
      return res.status(200).json({ok:true});
    }

    // -- /msg ID matn (rasmli ham) --
    if (text.startsWith('/msg') && isAdmin(uid)) {
      const parts = text.split(' ');
      if (parts.length < 2) { await send(ch,'📨 Format:\n<code>/msg ID xabar</code>'); return res.status(200).json({ok:true}); }
      const tid = parts[1];
      // Rasmli xabar (reply to photo)
      if (msg.reply_to_message?.photo) {
        const fid = msg.reply_to_message.photo[msg.reply_to_message.photo.length-1].file_id;
        const cap = parts.length > 2 ? parts.slice(2).join(' ') : (msg.reply_to_message.caption||'');
        try {
          await tg('sendPhoto', {chat_id:tid, photo:fid, caption:cap?`📨 <b>Admin:</b>\n${cap}`:'', parse_mode:'HTML'});
          await send(ch, `✅ Rasm yuborildi: <code>${tid}</code>`);
        } catch { await send(ch, `❌ Yuborib bo'lmadi: <code>${tid}</code>`); }
        return res.status(200).json({ok:true});
      }
      // Matnli xabar
      if (parts.length < 3) { await send(ch,'📨 Format:\n<code>/msg ID xabar matni</code>'); return res.status(200).json({ok:true}); }
      const message = parts.slice(2).join(' ');
      try {
        await send(tid, `📨 <b>Admin:</b>\n\n${message}`);
        await send(ch, `✅ Yuborildi: <code>${tid}</code>`);
      } catch { await send(ch, `❌ Yuborib bo'lmadi: <code>${tid}</code>`); }
      return res.status(200).json({ok:true});
    }

    // -- /ad reklama (rasmli ham) --
    if (text.startsWith('/ad') && isAdmin(uid)) {
      const adText = text.slice(3).trim();
      if (adText === 'off') {
        await send(ch, `✅ Reklama o'chirildi.`);
        return res.status(200).json({ok:true});
      }
      if (msg.reply_to_message?.photo) {
        const fid = msg.reply_to_message.photo[msg.reply_to_message.photo.length-1].file_id;
        await send(ch, `✅ Rasmli reklama saqlandi!\nFoydalanuvchilarga ko'rsatiladi.`);
        return res.status(200).json({ok:true});
      }
      if (!adText) { await send(ch,'📢 Format:\n<code>/ad Reklama matni</code>'); return res.status(200).json({ok:true}); }
      await send(ch, `✅ Reklama saqlandi:\n\n${adText}\n\n💡 Foydalanuvchilarning web ilovasida ko'rinadi.`);
      return res.status(200).json({ok:true});
    }

    // -- /poll savol + variantlar --
    if (text.startsWith('/poll') && isAdmin(uid)) {
      const lines = text.slice(5).trim().split('\n').filter(l=>l.trim());
      if (lines.length < 3) {
        await send(ch, '📊 Format:\n<code>/poll Savol?\nVariant 1\nVariant 2\nVariant 3</code>');
        return res.status(200).json({ok:true});
      }
      const question = lines[0];
      const options = lines.slice(1).map(o=>o.trim());
      try {
        await tg('sendPoll', {chat_id:ch, question, options:JSON.stringify(options), is_anonymous:false});
        await send(ch, `✅ So'rovnoma yaratildi!\nFoydalanuvchilarga yuborish uchun forward qiling.`);
      } catch(e) { await send(ch, `❌ Xato: ${e.message}`); }
      return res.status(200).json({ok:true});
    }

    // -- Noma'lum --
    if (text && !text.startsWith('/')) {
      await send(ch, '💡 /start yuboring.');
    }

    return res.status(200).json({ok:true});
  } catch(err) {
    console.error(err);
    return res.status(200).json({ok:true});
  }
};
