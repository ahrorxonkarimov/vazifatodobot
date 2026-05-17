/* =============================================
   VazifaBot – app.js
   Main application logic
   ============================================= */

'use strict';

// ---- Auth guard ----
const user = JSON.parse(localStorage.getItem('vzb_user') || 'null');
if (!user) { window.location.href = 'index.html'; }

// ---- State ----
let tasks = JSON.parse(localStorage.getItem('vzb_tasks') || '[]');
let currentFilter    = 'all';
let currentCatFilter = 'all';
let currentSort      = 'newest';
let searchQuery      = '';
let newTaskStars     = 0;
let newTaskColor     = '';
let editTaskId       = null;
let editTaskStars    = 0;
let editTaskColor    = '';
let notificationsEnabled = false;
let reminderTimers   = {};

// ---- DOM refs ----
const taskInput       = document.getElementById('taskInput');
const addBtn          = document.getElementById('addBtn');
const taskList        = document.getElementById('taskList');
const emptyState      = document.getElementById('emptyState');
const noResultsState  = document.getElementById('noResultsState');
const searchInput     = document.getElementById('searchInput');
const searchBarWrap   = document.getElementById('searchBarWrap');
const searchClear     = document.getElementById('searchClear');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const gpFill          = document.getElementById('gpFill');
const gpPercent       = document.getElementById('gpPercent');
const sortSelect      = document.getElementById('sortSelect');
const darkToggle      = document.getElementById('darkToggle');
const notifToggle     = document.getElementById('notifToggle');

// ---- Init ----
function init() {
  loadUser();
  loadSettings();
  renderAll();
  setupEventListeners();
  scheduleReminders();
  setGreeting();
}

function loadUser() {
  if (!user) return;
  // Topbar
  document.getElementById('topbarName').textContent = user.name;
  document.getElementById('greeting').textContent   = getGreeting();
  if (user.photo) {
    const av = document.getElementById('topbarAvatar');
    av.style.backgroundImage = `url(${user.photo})`;
    av.style.backgroundSize  = 'cover';
    av.textContent = '';
  } else {
    document.getElementById('topbarAvatar').textContent = user.name.charAt(0).toUpperCase();
  }
  // Sidebar
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarTid').textContent  = user.tid ? `ID: ${user.tid}` : '';
  const sav = document.getElementById('sidebarAvatar');
  if (user.photo) {
    sav.style.backgroundImage = `url(${user.photo})`;
    sav.style.backgroundSize  = 'cover';
    sav.textContent = '';
  } else {
    sav.textContent = user.name.charAt(0).toUpperCase();
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Yaxshi tun,';
  if (h < 12) return 'Xayrli tong,';
  if (h < 17) return 'Xayrli kun,';
  if (h < 21) return 'Xayrli kech,';
  return 'Yaxshi tun,';
}
function setGreeting() {
  document.getElementById('greeting').textContent = getGreeting();
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('vzb_settings') || '{}');
  // Dark/light
  if (settings.lightMode) {
    document.body.classList.add('light-mode');
    darkToggle.checked = false;
  } else {
    darkToggle.checked = true;
  }
  // Brand color
  if (settings.brandColor) {
    document.documentElement.style.setProperty('--primary', settings.brandColor);
    document.querySelectorAll('#colorSwatches .swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === settings.brandColor);
    });
  }
  // Notifications
  notificationsEnabled = !!settings.notifications;
  notifToggle.checked  = notificationsEnabled;
  // Sort
  if (settings.sort) { currentSort = settings.sort; sortSelect.value = currentSort; }
}

function saveSettings(patch) {
  const s = JSON.parse(localStorage.getItem('vzb_settings') || '{}');
  Object.assign(s, patch);
  localStorage.setItem('vzb_settings', JSON.stringify(s));
}

// ---- Save/Load tasks ----
function saveTasks() {
  localStorage.setItem('vzb_tasks', JSON.stringify(tasks));
}

// ---- Render ----
function renderAll() {
  renderTasks();
  updateStats();
  updateProgress();
}

function getFilteredSortedTasks() {
  let list = [...tasks];

  // Search
  if (searchQuery) {
    list = list.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  // Category filter
  if (currentCatFilter !== 'all') {
    list = list.filter(t => t.category === currentCatFilter);
  }

  // Status filter
  if (currentFilter === 'active')  list = list.filter(t => !t.done);
  if (currentFilter === 'done')    list = list.filter(t => t.done);
  if (currentFilter === 'overdue') list = list.filter(t => isOverdue(t));

  // Sort
  list.sort((a, b) => {
    switch (currentSort) {
      case 'oldest':   return a.createdAt - b.createdAt;
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      case 'priority': return (b.stars || 0) - (a.stars || 0);
      case 'alpha':    return a.text.localeCompare(b.text, 'uz');
      default:         return b.createdAt - a.createdAt; // newest
    }
  });

  return list;
}

function isOverdue(task) {
  if (!task.deadline || task.done) return false;
  return new Date(task.deadline) < new Date();
}

function isSoon(task) {
  if (!task.deadline || task.done) return false;
  const diff = new Date(task.deadline) - new Date();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

const CAT_LABELS = {
  dars:'📖 Dars', sport:'🏋️ Sport', uy:'🏠 Uy ishi',
  shaxsiy:'😊 Shaxsiy', boshqa:'📌 Boshqa'
};

function formatDeadline(dl) {
  if (!dl) return '';
  const d = new Date(dl);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) {
    const h = Math.abs(Math.floor(diff / 3600000));
    return h < 24 ? `${h} soat oldin o'tdi` : `${Math.floor(h/24)} kun oldin o'tdi`;
  }
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return `${Math.floor(diff/60000)} daqiqa qoldi`;
  if (h < 24) return `${h} soat qoldi`;
  return `${Math.floor(h/24)} kun qoldi`;
}

function renderTasks() {
  const list = getFilteredSortedTasks();
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    noResultsState.classList.add('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  if (list.length === 0) {
    noResultsState.classList.remove('hidden');
    return;
  }
  noResultsState.classList.add('hidden');

  list.forEach(task => {
    const card = buildTaskCard(task);
    taskList.appendChild(card);
  });
}

function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card${task.done ? ' done' : ''}`;
  card.dataset.id = task.id;

  const color = task.color || 'var(--primary)';
  const overdueClass = isOverdue(task) ? ' overdue' : (isSoon(task) ? ' soon' : '');
  const starsHtml = task.stars
    ? `<span class="task-stars">${'★'.repeat(task.stars)}${'☆'.repeat(5 - task.stars)}</span>`
    : '';
  const deadlineBadge = task.deadline
    ? `<span class="task-badge deadline${overdueClass}">📅 ${formatDeadline(task.deadline)}</span>`
    : '';
  const catBadge = task.category && task.category !== 'boshqa'
    ? `<span class="task-badge category">${CAT_LABELS[task.category] || task.category}</span>`
    : '';

  card.innerHTML = `
    <div class="task-stripe" style="background:${color}"></div>
    <div class="task-main">
      <div class="task-check-wrap">
        <input type="checkbox" class="task-checkbox" id="chk${task.id}"
          ${task.done ? 'checked' : ''} aria-label="Bajarildi deb belgilash">
      </div>
      <div class="task-content">
        <label class="task-text" for="chk${task.id}">${escHtml(task.text)}</label>
        <div class="task-meta">
          ${catBadge}
          ${deadlineBadge}
          ${starsHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit" data-id="${task.id}" aria-label="Tahrirlash" title="Tahrirlash">✏️</button>
        <button class="task-action-btn delete" data-id="${task.id}" aria-label="O'chirish" title="O'chirish">🗑️</button>
      </div>
    </div>
  `;

  // Checkbox
  card.querySelector('.task-checkbox').addEventListener('change', e => {
    toggleTask(task.id, e.target.checked);
  });
  // Edit
  card.querySelector('.task-action-btn.edit').addEventListener('click', () => openEditModal(task.id));
  // Delete
  card.querySelector('.task-action-btn.delete').addEventListener('click', () => deleteTask(task.id, card));

  return card;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Core actions ----
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.classList.add('shake-input');
    setTimeout(() => taskInput.classList.remove('shake-input'), 400);
    showToast('Vazifa matnini kiriting!', 'warning', '⚠️');
    return;
  }
  const task = {
    id:        Date.now().toString(),
    text,
    done:      false,
    createdAt: Date.now(),
    category:  document.getElementById('taskCategory').value || 'boshqa',
    stars:     newTaskStars,
    deadline:  document.getElementById('taskDeadline').value || '',
    reminder:  document.getElementById('taskReminder').value || '',
    color:     newTaskColor,
  };
  tasks.unshift(task);
  saveTasks();

  // Schedule reminder
  if (task.reminder) scheduleOneReminder(task);

  // Reset form
  taskInput.value = '';
  document.getElementById('taskDeadline').value  = '';
  document.getElementById('taskReminder').value  = '';
  document.getElementById('taskCategory').value  = 'boshqa';
  setStars(0, 'new');
  setTaskColor('', 'new');

  renderAll();
  showToast('Vazifa qo\'shildi!', 'success', '✅');
  confetti();
}

function toggleTask(id, done) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = done;
  task.doneAt = done ? Date.now() : null;
  saveTasks();
  renderAll();
  if (done) showToast('Barakalla! Vazifa bajarildi 🎉', 'success', '🏆');
}

function deleteTask(id, cardEl) {
  cardEl.style.transition = 'all 0.3s ease';
  cardEl.style.opacity  = '0';
  cardEl.style.transform = 'translateX(100px)';
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
  }, 280);
  showToast('Vazifa o\'chirildi', 'info', '🗑️');
}

// ---- Stats ----
function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const pending = total - done;
  const overdue = tasks.filter(t => isOverdue(t)).length;
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statDone').textContent    = done;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statOverdue').textContent = overdue;
}

function updateProgress() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  gpFill.style.width         = pct + '%';
  gpPercent.textContent      = pct + '%';
}

// ---- Edit modal ----
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editTaskId    = id;
  editTaskStars = task.stars || 0;
  editTaskColor = task.color || '';

  document.getElementById('editTaskText').value = task.text;
  document.getElementById('editCategory').value  = task.category || 'boshqa';
  document.getElementById('editDeadline').value  = task.deadline || '';
  document.getElementById('editReminder').value  = task.reminder || '';
  updateCharCount(task.text.length);
  setStars(editTaskStars, 'edit');
  setTaskColor(editTaskColor, 'edit');

  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editTaskText').focus();
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
  editTaskId = null;
}

function saveEdit() {
  if (!editTaskId) return;
  const text = document.getElementById('editTaskText').value.trim();
  if (!text) { showToast('Matn bo\'sh bo\'lmasin!', 'warning', '⚠️'); return; }
  const task = tasks.find(t => t.id === editTaskId);
  if (!task) return;
  task.text     = text;
  task.category = document.getElementById('editCategory').value;
  task.deadline = document.getElementById('editDeadline').value;
  task.reminder = document.getElementById('editReminder').value;
  task.stars    = editTaskStars;
  task.color    = editTaskColor;
  saveTasks();
  if (task.reminder) scheduleOneReminder(task);
  renderAll();
  closeEditModal();
  showToast('Vazifa yangilandi!', 'success', '✅');
}

function updateCharCount(len) {
  document.getElementById('editCharCount').textContent = len;
}

// ---- Stars ----
function setStars(val, mode) {
  const picker = document.getElementById(mode === 'edit' ? 'editStarPicker' : 'starPicker');
  if (!picker) return;
  picker.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
  if (mode === 'edit') editTaskStars = val;
  else newTaskStars = val;
}

function setupStarPicker(pickerId, mode) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  picker.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => setStars(parseInt(star.dataset.val), mode));
    star.addEventListener('mouseenter', () => {
      picker.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.val) <= parseInt(star.dataset.val));
      });
    });
    star.addEventListener('mouseleave', () => {
      setStars(mode === 'edit' ? editTaskStars : newTaskStars, mode);
    });
  });
}

// ---- Color pickers ----
function setTaskColor(color, mode) {
  const pickerId = mode === 'edit' ? 'editColorPicker' : 'taskColorPicker';
  const picker   = document.getElementById(pickerId);
  if (!picker) return;
  picker.querySelectorAll('.task-color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === color);
  });
  if (mode === 'edit') editTaskColor = color;
  else newTaskColor = color;
}

function setupColorPicker(pickerId, mode) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  picker.querySelectorAll('.task-color-swatch').forEach(s => {
    s.addEventListener('click', () => setTaskColor(s.dataset.color, mode));
  });
}

// ---- Notifications / Reminders ----
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Brauzeringiz xabarnomalarni qo\'llab-quvvatlamaydi', 'error', '❌');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function scheduleReminders() {
  tasks.forEach(task => {
    if (task.reminder && !task.done) scheduleOneReminder(task);
  });
}

function scheduleOneReminder(task) {
  if (!task.reminder) return;
  const ms = new Date(task.reminder) - Date.now();
  if (ms <= 0) return;
  if (reminderTimers[task.id]) clearTimeout(reminderTimers[task.id]);
  reminderTimers[task.id] = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('📚 VazifaBot Eslatma', {
        body: task.text,
        icon: 'https://cdn-icons-png.flaticon.com/512/2098/2098402.png',
        tag:  task.id,
      });
    }
    showToast(`⏰ Eslatma: ${task.text}`, 'info', '🔔');
  }, ms);
}

// ---- Sidebar brand color swatches ----
function setupColorSwatches() {
  document.getElementById('colorSwatches').querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      document.documentElement.style.setProperty('--primary', s.dataset.color);
      document.querySelectorAll('#colorSwatches .swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      saveSettings({ brandColor: s.dataset.color });
    });
  });
}

// ---- Toast ----
function showToast(msg, type = 'info', icon = 'ℹ️') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => {
    t.classList.add('toast-fade-out');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ---- Confetti ----
function confetti() {
  const colors = ['#6C5CE7','#00CEC9','#FD79A8','#FDCB6E','#00B894','#74B9FF'];
  const container = document.getElementById('confettiContainer');
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${Math.random()*10+6}px;
      height:${Math.random()*10+6}px;
      border-radius:${Math.random()>0.5?'50%':'2px'};
      animation-delay:${Math.random()*0.4}s;
      animation-duration:${Math.random()*0.5+0.8}s;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

// ---- Export ----
function exportTasks() {
  const data = JSON.stringify({ user: user?.name, exportedAt: new Date().toISOString(), tasks }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `vazifalar_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast('Vazifalar eksport qilindi!', 'success', '📤');
}

// ---- Event Listeners ----
function setupEventListeners() {
  // Add task
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // Options toggle
  const optToggle = document.getElementById('optionsToggle');
  const optBody   = document.getElementById('optionsBody');
  optToggle.addEventListener('click', () => {
    const open = optBody.classList.toggle('open');
    optToggle.setAttribute('aria-expanded', open);
  });

  // Star pickers
  setupStarPicker('starPicker', 'new');
  setupStarPicker('editStarPicker', 'edit');

  // Color pickers
  setupColorPicker('taskColorPicker', 'new');
  setupColorPicker('editColorPicker', 'edit');

  // Filter tabs
  document.getElementById('filterTabs').addEventListener('click', e => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    document.querySelectorAll('.filter-tab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    currentFilter = btn.dataset.filter;
    renderAll();
  });

  // Category filter (sidebar)
  document.getElementById('catFilterList').addEventListener('click', e => {
    const btn = e.target.closest('.cat-filter-btn');
    if (!btn) return;
    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCatFilter = btn.dataset.cat;
    renderAll();
    // Close sidebar on mobile
    if (window.innerWidth < 768) closeSidebar();
  });

  // Sort
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    saveSettings({ sort: currentSort });
    renderAll();
  });

  // Search toggle
  searchToggleBtn.addEventListener('click', () => {
    const open = searchBarWrap.classList.toggle('open');
    if (open) { searchInput.focus(); }
    else { searchInput.value = ''; searchQuery = ''; renderAll(); }
  });
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    renderAll();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = ''; searchQuery = ''; renderAll(); searchInput.focus();
  });

  // Sidebar
  document.getElementById('menuBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Dark mode
  darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('light-mode', !darkToggle.checked);
    saveSettings({ lightMode: !darkToggle.checked });
  });

  // Notifications
  notifToggle.addEventListener('change', async () => {
    if (notifToggle.checked) {
      const granted = await requestNotificationPermission();
      notificationsEnabled = granted;
      notifToggle.checked  = granted;
      if (!granted) showToast('Xabarnomaga ruxsat berilmadi', 'error', '❌');
      else { showToast('Eslatmalar yoqildi!', 'success', '🔔'); scheduleReminders(); }
    } else {
      notificationsEnabled = false;
    }
    saveSettings({ notifications: notificationsEnabled });
  });

  // Notification bell button (topbar)
  document.getElementById('notifBtn').addEventListener('click', async () => {
    const granted = await requestNotificationPermission();
    if (granted) showToast('Eslatma ruxsati berildi!', 'success', '🔔');
  });

  // Clear completed
  document.getElementById('clearCompletedBtn').addEventListener('click', () => {
    const count = tasks.filter(t => t.done).length;
    if (count === 0) { showToast('Bajarilgan vazifalar yo\'q', 'info', 'ℹ️'); return; }
    tasks = tasks.filter(t => !t.done);
    saveTasks(); renderAll();
    showToast(`${count} ta bajarilgan vazifa tozalandi`, 'success', '🧹');
    closeSidebar();
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', () => { exportTasks(); closeSidebar(); });

  // Edit modal
  document.getElementById('editModalClose').addEventListener('click', closeEditModal);
  document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
  document.getElementById('editSaveBtn').addEventListener('click', saveEdit);
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
  });
  document.getElementById('editTaskText').addEventListener('input', e => {
    updateCharCount(e.target.value.length);
  });

  // Color swatches (sidebar)
  setupColorSwatches();

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('vzb_user');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeEditModal(); closeSidebar(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchBarWrap.classList.add('open');
      searchInput.focus();
    }
  });
}

// ---- Sidebar helpers ----
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ---- Deadline auto-refresh ----
setInterval(() => {
  // Re-render deadline badges every minute
  document.querySelectorAll('.task-badge.deadline').forEach(el => {
    const card = el.closest('.task-card');
    if (!card) return;
    const task = tasks.find(t => t.id === card.dataset.id);
    if (task && task.deadline) {
      el.textContent = `📅 ${formatDeadline(task.deadline)}`;
      const over = isOverdue(task);
      const soon = isSoon(task);
      el.className = `task-badge deadline${over?' overdue':soon?' soon':''}`;
    }
  });
}, 60000);

// ---- Start ----
init();
