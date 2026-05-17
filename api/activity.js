// api/activity.js — Foydalanuvchi faoliyatini adminga yuborish
const BOT_TOKEN = process.env.BOT_TOKEN || '8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA';
const ADMIN_ID = 5985723887;

async function sendToAdmin(text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: ADMIN_ID, text, parse_mode: 'HTML' })
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const { userId, userName, action, detail } = req.body;
    if (!userId || !action) return res.status(400).json({ ok: false });

    const now = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    const icons = {
      'add': '➕', 'done': '✅', 'undone': '🔄', 'delete': '🗑️',
      'edit': '✏️', 'clear': '🧹', 'login': '🚪', 'export': '📤',
      'settings': '⚙️'
    };
    const icon = icons[action] || '📌';

    await sendToAdmin(
      `${icon} <b>${action.toUpperCase()}</b>\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 ${userName || 'Noma\'lum'}\n` +
      `🆔 <code>${userId}</code>\n` +
      `📝 ${detail || '—'}\n` +
      `🕐 ${now}`
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false });
  }
};
