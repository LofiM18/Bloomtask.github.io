// ============================================================
//  BloomTask — app.js
//  RNG-based XP rolls, 3-phase plant evolution, garden room
//  All data saved to localStorage — no server needed.
// ============================================================

// ---- Config ------------------------------------------------
const BLOOM_MAX = 1000;

const SLOT_IDS = [
  'slot-bc-top','slot-bc-s1','slot-bc-s2','slot-bc-s3',
  'slot-ws1','slot-ws2',
  'slot-table-top','slot-table-mid',
  'slot-floor','slot-windowsill'
];

const SLOT_CAPS = {
  'slot-bc-top': 2, 'slot-bc-s1': 2, 'slot-bc-s2': 2, 'slot-bc-s3': 2,
  'slot-ws1': 2, 'slot-ws2': 2,
  'slot-table-top': 2, 'slot-table-mid': 2,
  'slot-floor': 4, 'slot-windowsill': 2
};

// ---- Storage helpers ---------------------------------------
const todayKey = () => new Date().toISOString().slice(0, 10);

function loadData() {
  try { return JSON.parse(localStorage.getItem('bloomtask_data') || '{}'); }
  catch (e) { return {}; }
}
function saveData(data) {
  try { localStorage.setItem('bloomtask_data', JSON.stringify(data)); }
  catch (e) { console.warn('Storage full'); }
}

function getTodayRecord(data) {
  const key = todayKey();
  if (!data[key]) data[key] = { tasks: [], xp: 0, bloomXP: 0, date: key };
  if (data[key].bloomXP === undefined) data[key].bloomXP = 0;
  return data[key];
}

function loadLayout() {
  try { return JSON.parse(localStorage.getItem('bloomtask_layout') || '{}'); }
  catch (e) { return {}; }
}
function saveLayout(layout) {
  try { localStorage.setItem('bloomtask_layout', JSON.stringify(layout)); }
  catch (e) {}
}

// ---- RNG roll system ---------------------------------------
/**
 * Roll random XP with weighted rarities:
 *  Common (50%)    10-50 XP
 *  Uncommon (28%)  50-120 XP
 *  Rare (15%)      100-200 XP
 *  Epic (6%)       150-250 XP
 *  Legendary (1%)  300 XP
 */
function rollXP() {
  const r = Math.random();
  if (r < 0.50) return { xp: Math.floor(Math.random() * 41)  + 10,  rarity: 'common',    label: 'Common',    cls: 'xp-common',    icon: '🌿' };
  if (r < 0.78) return { xp: Math.floor(Math.random() * 71)  + 50,  rarity: 'uncommon',  label: 'Uncommon',  cls: 'xp-common',    icon: '🌱' };
  if (r < 0.93) return { xp: Math.floor(Math.random() * 101) + 100, rarity: 'rare',      label: 'Rare',      cls: 'xp-rare',      icon: '✨' };
  if (r < 0.99) return { xp: Math.floor(Math.random() * 101) + 150, rarity: 'epic',      label: 'Epic',      cls: 'xp-epic',      icon: '🌟' };
  return            { xp: 300,                                        rarity: 'legendary', label: 'LEGENDARY', cls: 'xp-legendary', icon: '👑' };
}

// ---- Phase system ------------------------------------------
function getPhase(bloomXP) {
  if (bloomXP >= 700) return 3;
  if (bloomXP >= 350) return 2;
  return 1;
}
function getPhaseInfo(phase) {
  if (phase === 3) return { label: 'Full Bloom',  cls: 'phase-3', icon: '🌺' };
  if (phase === 2) return { label: 'Budding',     cls: 'phase-2', icon: '🌷' };
  return                  { label: 'Seedling',    cls: 'phase-1', icon: '🌱' };
}

// ---- Flower SVG generator ----------------------------------
/**
 * Generates SVG flower content based on bloomXP (0-1000).
 * Phase 1 (0-349)  → terracotta pot, pink/pastel petals
 * Phase 2 (350-699)→ purple pot, lavender star petals
 * Phase 3 (700+)   → golden pot, sunflower petals
 */
function flowerSVG(bloomXP, size = 100) {
  const bloomPct = Math.min(Math.round((bloomXP / BLOOM_MAX) * 100), 100);
  const phase = getPhase(bloomXP);
  const s = size, cx = s / 2;

  const potH = s * 0.18, potY = s - potH;
  const potW = s * 0.36, rimW = s * 0.44, rimH = s * 0.1;
  const rimY = potY - rimH * 0.4;

  const potColor = phase === 3 ? '#c87820' : phase === 2 ? '#9060b8' : '#a0714f';
  const rimColor = phase === 3 ? '#a05010' : phase === 2 ? '#6040a0' : '#8B5E3C';

  let p = `
    <rect x="${cx - potW/2}" y="${potY}" width="${potW}" height="${potH}" rx="3" fill="${potColor}"/>
    <rect x="${cx - rimW/2}" y="${rimY}" width="${rimW}" height="${rimH}" rx="3" fill="${rimColor}"/>
  `;

  if (bloomPct <= 0) {
    p += `<ellipse cx="${cx}" cy="${rimY + rimH * 0.5}" rx="${rimW * 0.35}" ry="${rimH * 0.35}" fill="#6b4226"/>`;
    return p;
  }

  const stemMaxH = s * 0.52;
  const stemH = stemMaxH * Math.min(bloomPct / 40, 1);
  const stemTop = rimY - stemH;
  const stemColor = phase === 3 ? '#7a9a2a' : phase === 2 ? '#6a7aaa' : '#5a8a4a';

  p += `<rect x="${cx - 2}" y="${stemTop}" width="4" height="${stemH}" rx="2" fill="${stemColor}"/>`;

  if (bloomPct < 15) {
    p += `<circle cx="${cx}" cy="${stemTop}" r="${s * 0.05}" fill="#9de08a"/>`;
    return p;
  }
  if (bloomPct < 30) {
    const bc = phase === 2 ? '#b898e8' : phase === 3 ? '#f8d060' : '#f4c0d1';
    p += `<ellipse cx="${cx}" cy="${stemTop - s*0.04}" rx="${s*0.07}" ry="${s*0.09}" fill="${bc}"/>`;
    return p;
  }

  if (bloomPct >= 30) {
    const lY = stemTop + stemH * 0.5;
    const lc = phase === 3 ? '#7a9a2a' : phase === 2 ? '#6a7aaa' : '#5a8a4a';
    p += `
      <ellipse cx="${cx - s*0.12}" cy="${lY}" rx="${s*0.1}" ry="${s*0.06}" fill="${lc}" transform="rotate(-25 ${cx - s*0.12} ${lY})"/>
      <ellipse cx="${cx + s*0.12}" cy="${lY - s*0.04}" rx="${s*0.1}" ry="${s*0.06}" fill="${lc}" transform="rotate(25 ${cx + s*0.12} ${lY - s*0.04})"/>
    `;
  }

  const fcy = stemTop - s * 0.04;
  const r = s * 0.13;

  if (phase === 1) {
    if (bloomPct < 55) {
      const pc = ['#f4b8c8','#c8ddf4','#f4e4b8','#c8f4d8'];
      [0,90,180,270].forEach((a, i) => {
        const rad = a * Math.PI / 180;
        const bx = cx + Math.cos(rad) * r * 0.9, by = fcy + Math.sin(rad) * r * 0.9;
        p += `<ellipse cx="${bx}" cy="${by}" rx="${r*0.55}" ry="${r*0.55}" fill="${pc[i]}"/>`;
      });
      p += `<circle cx="${cx}" cy="${fcy}" r="${r*0.45}" fill="#f0a830"/>`;
      return p;
    }
    const pc = ['#f4b8c8','#f4d8a8','#c8f0d8','#b8d8f4','#e8c8f4','#f4c8b8'];
    for (let i = 0; i < 6; i++) {
      const rad = i * 60 * Math.PI / 180;
      const bx = cx + Math.cos(rad) * r, by = fcy + Math.sin(rad) * r;
      p += `<ellipse cx="${bx}" cy="${by}" rx="${r*0.6}" ry="${r*0.6}" fill="${pc[i]}"/>`;
    }
    p += `<circle cx="${cx}" cy="${fcy}" r="${r*0.5}" fill="#f0a830"/>`;
    return p;
  }

  if (phase === 2) {
    const fr = r * 1.1;
    const pc = ['#c8a8f4','#b8d0f8','#f4c8e8','#d8b8f8','#a8c4f4','#e8b8d8'];
    for (let i = 0; i < 6; i++) {
      const rad = (i * 60 + 15) * Math.PI / 180;
      const bx = cx + Math.cos(rad) * fr, by = fcy + Math.sin(rad) * fr;
      p += `<ellipse cx="${bx}" cy="${by}" rx="${fr*0.65}" ry="${fr*0.45}" fill="${pc[i]}" transform="rotate(${i*60+15} ${bx} ${by})"/>`;
    }
    p += `<circle cx="${cx}" cy="${fcy}" r="${fr*0.42}" fill="#9060c0"/>`;
    const sr = fr * 1.5;
    for (let i = 0; i < 6; i++) {
      const rad = i * 60 * Math.PI / 180;
      const sx = cx + Math.cos(rad) * sr, sy = fcy + Math.sin(rad) * sr;
      p += `<circle cx="${sx}" cy="${sy}" r="${s*0.035}" fill="#e0c8f8" opacity="0.7"/>`;
    }
    return p;
  }

  // Phase 3 — sunflower
  const fr = r * 1.3;
  const pc = ['#f8d060','#f4a840','#f8e080','#f0c040','#f8d870','#f4b040','#fae890','#f0c850'];
  for (let i = 0; i < 8; i++) {
    const rad = i * 45 * Math.PI / 180;
    const bx = cx + Math.cos(rad) * fr, by = fcy + Math.sin(rad) * fr;
    p += `<ellipse cx="${bx}" cy="${by}" rx="${fr*0.58}" ry="${fr*0.42}" fill="${pc[i]}" transform="rotate(${i*45} ${bx} ${by})"/>`;
  }
  p += `<circle cx="${cx}" cy="${fcy}" r="${fr*0.46}" fill="#e07010"/>`;
  const sr = fr * 1.7;
  for (let i = 0; i < 8; i++) {
    const rad = i * 45 * Math.PI / 180;
    const sx = cx + Math.cos(rad) * sr, sy = fcy + Math.sin(rad) * sr;
    p += `<text x="${sx - 3}" y="${sy + 4}" font-size="${s*0.09}" fill="#f0a830" opacity="0.9">✦</text>`;
  }
  return p;
}

function renderFlower(svgEl, bloomXP, size) {
  svgEl.innerHTML = flowerSVG(bloomXP, size);
}

// ---- Toast -------------------------------------------------
function showToast(msg, duration = 2200) {
  const t = document.getElementById('xp-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ---- Init --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-add-task').addEventListener('click', addTask);
  document.getElementById('task-name').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  document.getElementById('btn-bloom').addEventListener('click', showBloom);
  document.getElementById('back-btn').addEventListener('click', showToday);
  document.getElementById('popup-ok').addEventListener('click', hideBloomPopup);
  document.getElementById('bloom-overlay').addEventListener('click', hideBloomPopup);
  renderToday();
  updateCalendar();
  setInterval(checkMidnight, 60000);
});

// ---- Add Task ----------------------------------------------
function addTask() {
  const nameEl = document.getElementById('task-name');
  const durEl  = document.getElementById('task-duration');
  const freeEl = document.getElementById('task-free-time');
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.style.borderColor = '#e05050';
    setTimeout(() => nameEl.style.borderColor = '', 800);
    return;
  }
  const task = {
    id: Date.now(),
    name,
    duration: durEl.value.trim(),
    freeTime: freeEl.value.trim(),
    xpRoll: null, rarity: null, rarityLabel: null, rarityCls: null, rarityIcon: null,
    done: false,
    createdAt: new Date().toISOString()
  };
  const data = loadData();
  const today = getTodayRecord(data);
  today.tasks.push(task);
  saveData(data);
  nameEl.value = ''; durEl.value = ''; freeEl.value = '';
  renderToday();
  updateCalendar();
}

// ---- Render Today ------------------------------------------
function renderToday() {
  const data = loadData();
  const today = getTodayRecord(data);
  const tasks = today.tasks;
  const now = new Date();

  document.getElementById('today-date-label').textContent =
    now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('cal-date-label').textContent =
    now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const done = tasks.filter(t => t.done);
  document.getElementById('today-task-summary').textContent = `${done.length} of ${tasks.length} tasks done`;

  // XP bar — sum of rolled XP from completed tasks
  const totalXP = done.reduce((s, t) => s + (t.xpRoll || 0), 0);
  const xpPct = Math.min((totalXP / 1000) * 100, 100);
  document.getElementById('xp-fill').style.width = xpPct + '%';
  document.getElementById('xp-current').textContent = totalXP;

  // Bloom meter — driven by accumulated bloomXP (separate from task XP sum)
  const bloomXP = today.bloomXP || 0;
  const bloomPct = Math.min(Math.round((bloomXP / BLOOM_MAX) * 100), 100);
  document.getElementById('bloom-fill').style.width = bloomPct + '%';
  document.getElementById('bloom-pct').textContent = bloomPct;
  document.getElementById('bloom-xp-total').textContent = bloomXP;

  renderFlower(document.getElementById('today-flower'), bloomXP, 100);

  // Phase badge
  const phase = getPhase(bloomXP);
  const pi = getPhaseInfo(phase);
  const pb = document.getElementById('phase-badge');
  pb.textContent = pi.icon + ' ' + pi.label + ' · Phase ' + phase;
  pb.className = 'phase-badge ' + pi.cls;

  // Streak
  document.getElementById('streak-count').textContent = calcStreak(data);

  // Task list
  const listEl = document.getElementById('task-list');
  const emptyEl = document.getElementById('empty-state');
  listEl.innerHTML = '';
  if (!tasks.length) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    tasks.forEach(t => listEl.appendChild(makeTaskEl(t)));
  }
}

function makeTaskEl(task) {
  const el = document.createElement('div');
  el.className = 'task-item' + (task.done ? ' done-item' : '');

  const chk = document.createElement('div');
  chk.className = 'task-checkbox' + (task.done ? ' checked' : '');
  chk.addEventListener('click', () => toggleTask(task.id));

  const info = document.createElement('div');
  info.className = 'task-info';

  const nm = document.createElement('div');
  nm.className = 'task-name-text' + (task.done ? ' done' : '');
  nm.textContent = task.name;

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  const pts = [];
  if (task.duration) pts.push(task.duration);
  if (task.freeTime) pts.push('Free: ' + task.freeTime);
  meta.textContent = pts.join(' · ');

  info.appendChild(nm);
  if (pts.length) info.appendChild(meta);

  const badge = document.createElement('div');
  if (task.done && task.xpRoll) {
    badge.className = 'task-xp-badge ' + (task.rarityCls || 'xp-common');
    badge.textContent = (task.rarityIcon || '🌿') + ' +' + task.xpRoll + ' XP · ' + (task.rarityLabel || 'Common');
  } else {
    badge.className = 'task-xp-badge xp-common';
    badge.textContent = '🎲 Roll on complete';
  }

  const del = document.createElement('button');
  del.className = 'task-delete';
  del.textContent = '×';
  del.addEventListener('click', () => deleteTask(task.id));

  el.appendChild(chk);
  el.appendChild(info);
  el.appendChild(badge);
  el.appendChild(del);
  return el;
}

// ---- Toggle task (rolls XP on completion) ------------------
function toggleTask(id) {
  const data = loadData();
  const today = getTodayRecord(data);
  const task = today.tasks.find(t => t.id === id);
  if (!task) return;

  const wasDone = task.done;
  task.done = !task.done;

  if (!wasDone && task.done) {
    // Complete: roll XP and add to bloom meter
    const roll = rollXP();
    task.xpRoll = roll.xp;
    task.rarity = roll.rarity;
    task.rarityLabel = roll.label;
    task.rarityCls = roll.cls;
    task.rarityIcon = roll.icon;

    const prevBloomXP = today.bloomXP || 0;
    const prevPhase = getPhase(prevBloomXP);
    today.bloomXP = Math.min(prevBloomXP + roll.xp, BLOOM_MAX);
    const newPhase = getPhase(today.bloomXP);

    saveData(data);
    showToast(roll.icon + ' ' + roll.label + ' Roll! +' + roll.xp + ' Bloom XP');

    if (newPhase > prevPhase) {
      const pi = getPhaseInfo(newPhase);
      setTimeout(() => {
        const wrap = document.getElementById('flower-wrap');
        wrap.classList.add('evo-anim');
        wrap.addEventListener('animationend', () => wrap.classList.remove('evo-anim'), { once: true });
        showEvoPopup(newPhase, pi);
      }, 600);
    } else if (today.bloomXP >= BLOOM_MAX) {
      setTimeout(() => showBloomPopup(), 600);
    }
  } else if (wasDone && !task.done) {
    // Uncomplete: refund bloom XP
    today.bloomXP = Math.max((today.bloomXP || 0) - (task.xpRoll || 0), 0);
    task.xpRoll = null; task.rarity = null;
    task.rarityLabel = null; task.rarityCls = null; task.rarityIcon = null;
    saveData(data);
  } else {
    saveData(data);
  }

  renderToday();
  updateCalendar();
}

function deleteTask(id) {
  const data = loadData();
  const today = getTodayRecord(data);
  const task = today.tasks.find(t => t.id === id);
  if (task && task.done && task.xpRoll) {
    today.bloomXP = Math.max((today.bloomXP || 0) - task.xpRoll, 0);
  }
  today.tasks = today.tasks.filter(t => t.id !== id);
  saveData(data);
  renderToday();
  updateCalendar();
}

// ---- Calendar ----------------------------------------------
function updateCalendar() {
  const data = loadData();
  const today = getTodayRecord(data);
  const tasks = today.tasks;
  const slotsEl = document.getElementById('cal-slots');
  slotsEl.innerHTML = '';

  if (!tasks.length) {
    const e = document.createElement('div');
    e.style.cssText = 'font-size:11px;color:#b0a090;padding:10px 0;text-align:center;';
    e.textContent = 'Add tasks to see your schedule';
    slotsEl.appendChild(e);
    return;
  }

  let hour = 8, min = 0;
  const fmt = (h, m) => {
    const ap = h >= 12 ? 'pm' : 'am';
    const hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${hh}:${String(m).padStart(2, '0')}${ap}`;
  };

  tasks.forEach((task, i) => {
    // Parse duration
    let mins = 60;
    const dur = (task.duration || '').toLowerCase();
    if (dur.includes('15')) mins = 15;
    else if (dur.includes('30')) mins = 30;
    else if (dur.includes('45')) mins = 45;
    else if (dur.includes('1.5') || dur.includes('90')) mins = 90;
    else if (dur.includes('2 h') || dur.includes('2h') || dur.includes('2hr')) mins = 120;

    // Parse free time override
    if (task.freeTime) {
      const m2 = task.freeTime.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
      if (m2) {
        let h2 = parseInt(m2[1]);
        const mm = m2[2] ? parseInt(m2[2]) : 0;
        const ap = m2[3] ? m2[3].toLowerCase() : null;
        if (ap === 'pm' && h2 < 12) h2 += 12;
        if (ap === 'am' && h2 === 12) h2 = 0;
        hour = h2; min = mm;
      }
    }

    const sl = document.createElement('div'); sl.className = 'cal-slot';
    const tEl = document.createElement('div'); tEl.className = 'cal-time'; tEl.textContent = fmt(hour, min);
    const blk = document.createElement('div');
    blk.className = 'cal-block ' + (task.done ? 'cb-done' : 'cb-todo');
    blk.textContent = (task.done ? '✓ ' : '') + task.name + (task.duration ? ` (${task.duration})` : '');
    sl.appendChild(tEl); sl.appendChild(blk); slotsEl.appendChild(sl);

    const endMin = min + mins;
    hour = hour + Math.floor(endMin / 60); min = endMin % 60;

    if (i < tasks.length - 1) {
      const bs = document.createElement('div'); bs.className = 'cal-slot';
      const bt = document.createElement('div'); bt.className = 'cal-time'; bt.textContent = fmt(hour, min);
      const bb = document.createElement('div'); bb.className = 'cal-block cb-break'; bb.textContent = 'Break · 10 min';
      bs.appendChild(bt); bs.appendChild(bb); slotsEl.appendChild(bs);
      min += 10;
      if (min >= 60) { hour++; min -= 60; }
    }
  });
}

// ---- Streak ------------------------------------------------
function calcStreak(data) {
  const today = todayKey();
  let streak = 0, check = today;
  for (let i = 0; i < 365; i++) {
    const d = data[check];
    if (d && d.tasks && d.tasks.some(t => t.done)) {
      streak++;
      const dt = new Date(check);
      dt.setDate(dt.getDate() - 1);
      check = dt.toISOString().slice(0, 10);
    } else { break; }
  }
  return streak;
}

// ---- Popups ------------------------------------------------
function showEvoPopup(phase, pi) {
  document.getElementById('popup-icon').textContent = pi.icon;
  document.getElementById('popup-title').textContent = 'Phase ' + phase + ' Evolved!';
  document.getElementById('popup-sub').textContent = 'Your plant evolved to ' + pi.label + '!\nKeep completing tasks to grow further.';
  document.getElementById('bloom-overlay').classList.add('show');
  setTimeout(() => document.getElementById('bloom-popup').classList.add('show'), 50);
}

function showBloomPopup() {
  document.getElementById('popup-icon').textContent = '🌺';
  document.getElementById('popup-title').textContent = 'Full Bloom!';
  document.getElementById('popup-sub').textContent = 'Bloom meter maxed!\nYour golden sunflower is complete.';
  document.getElementById('bloom-overlay').classList.add('show');
  setTimeout(() => document.getElementById('bloom-popup').classList.add('show'), 50);
}

function hideBloomPopup() {
  document.getElementById('bloom-overlay').classList.remove('show');
  document.getElementById('bloom-popup').classList.remove('show');
}

// ---- View switching ----------------------------------------
function showBloom() {
  document.getElementById('view-today').classList.remove('active');
  document.getElementById('view-bloom').classList.add('active');
  renderGardenRoom();
  window.scrollTo(0, 0);
}

function showToday() {
  document.getElementById('view-bloom').classList.remove('active');
  document.getElementById('view-today').classList.add('active');
  window.scrollTo(0, 0);
}

// ---- Garden Room -------------------------------------------
let dragKey = null;

function makePotElement(dateKey, bloomXP, isToday, svgW, svgH) {
  const wrap = document.createElement('div');
  wrap.className = 'pot-in-room';
  wrap.dataset.key = dateKey;
  wrap.draggable = true;

  if (isToday) {
    const glow = document.createElement('div');
    glow.style.cssText = `width:${svgW}px;height:2px;background:#4a9e6b;border-radius:99px;margin:0 auto 2px;opacity:0.7;`;
    wrap.appendChild(glow);
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.style.width = svgW + 'px';
  svg.style.height = svgH + 'px';
  svg.style.display = 'block';
  renderFlower(svg, bloomXP, svgW);
  wrap.appendChild(svg);

  const lbl = document.createElement('div');
  lbl.className = 'pot-date-lbl';
  if (dateKey.startsWith('demo')) {
    lbl.textContent = 'demo';
  } else {
    const d = new Date(dateKey + 'T00:00:00');
    lbl.textContent = isToday ? 'today' : d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
  }

  const phase = getPhase(bloomXP);
  const pi = getPhaseInfo(phase);
  const pl = document.createElement('div');
  pl.className = 'pot-phase-lbl';
  pl.textContent = pi.icon + ' ' + pi.label;

  wrap.appendChild(lbl);
  wrap.appendChild(pl);

  wrap.addEventListener('dragstart', e => {
    dragKey = dateKey;
    wrap.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  wrap.addEventListener('dragend', () => {
    wrap.classList.remove('dragging');
    dragKey = null;
  });

  return wrap;
}

function renderGardenRoom() {
  const data = loadData();
  const keys = Object.keys(data).sort();

  // Stats bar
  let totalTasks = 0, totalXP = 0, fullBlooms = 0;
  keys.forEach(k => {
    const rec = data[k];
    totalTasks += rec.tasks.filter(t => t.done).length;
    totalXP += rec.tasks.filter(t => t.done).reduce((s, t) => s + (t.xpRoll || 0), 0);
    if ((rec.bloomXP || 0) >= BLOOM_MAX) fullBlooms++;
  });

  document.getElementById('stats-bar').innerHTML = `
    <div class="stat-pill">Tasks done <span>${totalTasks}</span></div>
    <div class="stat-pill">Total XP <span>${totalXP}</span></div>
    <div class="stat-pill">Streak <span>${calcStreak(data)} days</span></div>
    <div class="stat-pill">Full Blooms <span>${fullBlooms}</span></div>
    <div class="stat-pill">Pots <span>${keys.length}</span></div>
  `;

  const layout = loadLayout();

  // Render pots in room slots
  SLOT_IDS.forEach(slotId => {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;

    // Clear existing pots (leave slot-hint div if any)
    slotEl.querySelectorAll('.pot-in-room').forEach(e => e.remove());

    const placed = layout[slotId] || [];
    placed.forEach(dk => {
      const rec = data[dk];
      if (!rec) return;
      const bxp = rec.bloomXP || 0;
      const isToday = dk === todayKey();
      const sz = slotId === 'slot-floor' ? 54 : slotId === 'slot-windowsill' ? 36 : 42;
      slotEl.appendChild(makePotElement(dk, bxp, isToday, sz, Math.round(sz * 1.3)));
    });

    // Drag events on slot
    slotEl.addEventListener('dragover', e => { e.preventDefault(); slotEl.classList.add('drag-over'); });
    slotEl.addEventListener('dragleave', () => slotEl.classList.remove('drag-over'));
    slotEl.addEventListener('drop', e => {
      e.preventDefault();
      slotEl.classList.remove('drag-over');
      if (!dragKey) return;
      const layout2 = loadLayout();
      // Remove from any current slot
      Object.keys(layout2).forEach(sid => {
        layout2[sid] = (layout2[sid] || []).filter(k => k !== dragKey);
      });
      const cap = SLOT_CAPS[slotId] || 2;
      if (!layout2[slotId]) layout2[slotId] = [];
      if (layout2[slotId].length < cap) layout2[slotId].push(dragKey);
      saveLayout(layout2);
      renderGardenRoom();
    });
  });

  // Unplaced tray
  const tray = document.getElementById('tray-pots');
  tray.innerHTML = '';
  const layout2 = loadLayout();
  const placedKeys = new Set(Object.values(layout2).flat());
  const unplaced = keys.filter(k => !placedKeys.has(k));

  if (!keys.length) {
    const e = document.createElement('div');
    e.className = 'tray-empty';
    e.textContent = 'Complete tasks today to grow your first pot!';
    tray.appendChild(e);
  } else if (!unplaced.length) {
    const e = document.createElement('div');
    e.className = 'tray-empty';
    e.textContent = 'All pots are placed in the room! ✓';
    tray.appendChild(e);
  } else {
    unplaced.forEach(dk => {
      const rec = data[dk];
      const bxp = rec.bloomXP || 0;
      tray.appendChild(makePotElement(dk, bxp, dk === todayKey(), 50, 65));
    });
  }

  // Allow dropping back to tray
  tray.addEventListener('dragover', e => e.preventDefault());
  tray.addEventListener('drop', e => {
    e.preventDefault();
    if (!dragKey) return;
    const layout3 = loadLayout();
    Object.keys(layout3).forEach(sid => {
      layout3[sid] = (layout3[sid] || []).filter(k => k !== dragKey);
    });
    saveLayout(layout3);
    renderGardenRoom();
  });
}

// ---- Midnight check ----------------------------------------
function checkMidnight() {
  const stored = localStorage.getItem('bloomtask_last_day');
  const today = todayKey();
  if (stored && stored !== today) {
    renderToday();
    updateCalendar();
  }
  localStorage.setItem('bloomtask_last_day', today);
}
