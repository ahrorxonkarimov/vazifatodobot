// api/users.js — Foydalanuvchilar ro'yxati API
// POST — yangi foydalanuvchi qo'shish
// GET  — barcha foydalanuvchilar ro'yxatini olish (admin uchun)
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'vzb_users.json');

function readUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — ro'yxatni olish
  if (req.method === 'GET') {
    const users = readUsers();
    return res.status(200).json({ ok: true, count: users.length, users });
  }

  // POST — yangi foydalanuvchi qo'shish
  if (req.method === 'POST') {
    const { id, first_name, last_name, username, language_code, phone } = req.body;
    if (!id) return res.status(400).json({ ok: false });

    const users = readUsers();
    // Mavjud bo'lsa yangilash, yo'q bo'lsa qo'shish
    const idx = users.findIndex(u => String(u.id) === String(id));
    const userData = {
      id: String(id),
      first_name: first_name || '',
      last_name: last_name || '',
      username: username || '',
      language_code: language_code || '',
      phone: phone || '',
      registered_at: new Date().toISOString()
    };

    if (idx >= 0) {
      // Telefon yangilash (agar bor bo'lsa)
      if (phone) users[idx].phone = phone;
      users[idx].last_seen = new Date().toISOString();
    } else {
      users.push(userData);
    }

    saveUsers(users);
    return res.status(200).json({ ok: true, count: users.length });
  }

  return res.status(200).json({ ok: true });
};
