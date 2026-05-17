// api/check-sub.js — Obuna tekshirish API
const BOT_TOKEN = process.env.BOT_TOKEN || '8862354769:AAGAeshpu-SsKEesapafIPE9NG0Ch2cWWlA';
const CHANNEL = '@AbdullohhKarimov';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ ok: false, subscribed: false });

  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHANNEL, user_id: uid })
    });
    const data = await r.json();
    const subscribed = data.ok && ['creator', 'administrator', 'member'].includes(data.result?.status);
    return res.status(200).json({ ok: true, subscribed });
  } catch {
    return res.status(200).json({ ok: false, subscribed: false });
  }
};
