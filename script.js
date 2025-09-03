function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

/** Left pads with 0 to length 2 */
function pad2(n) { return String(n).padStart(2, '0'); }

/** Convert 24h hours (0..23) to 12h hours (1..12) */
function to12h(h) { const v = h % 12; return v === 0 ? 12 : v; }

/** AM/PM */
function ampm(h) { return h < 12 ? 'AM' : 'PM'; }

/**
 * Format a time for display
 * @param {{h:number,m:number,s?:number}} t
 * @param {boolean} use24h
 */
function formatDisplayTime(t, use24h) {
  const h = t.h, m = t.m, s = t.s ?? undefined;
  if (use24h) {
    return s == null ? `${pad2(h)}:${pad2(m)}` : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  } else {
    const hh = to12h(h);
    const base = s == null ? `${pad2(hh)}:${pad2(m)}` : `${pad2(hh)}:${pad2(m)}:${pad2(s)}`;
    return `${base} ${ampm(h)}`;
  }
}

/** Parse 'HH:MM' into {h,m} */
function parseHHMM(v) {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(v);
  if (!m) throw new Error(`Invalid time: ${v}`);
  return { h: Number(m[1]), m: Number(m[2]) };
}

/** Convert weekday JS Date.getDay() (0..6, Sun..Sat) to label */
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/**
 * Compute next Date when alarm should ring.
 * Handles once-only (repeat empty) or repeats (array of weekdays 0..6).
 * @param {{time: string, repeat: number[], enabled: boolean}} alarm
 * @param {Date} [now]
 * @returns {Date}
 */
function computeNextTrigger(alarm, now = new Date()) {
  const { h, m } = parseHHMM(alarm.time);
  // start from now
  const start = new Date(now.getTime());
  start.setSeconds(0,0);

  // Build candidate date at today's h:m
  const candidate = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h, m, 0, 0);

  // Helper to add days
  const plusDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n, d.getHours(), d.getMinutes());

  if (!alarm.repeat || alarm.repeat.length === 0) {
    // one-shot
    if (candidate <= start) return plusDays(candidate, 1);
    return candidate;
  }

  // repeating: find the next weekday >= today
  const today = start.getDay();
  for (let delta = 0; delta < 8; delta++) {
    const day = (today + delta) % 7;
    if (alarm.repeat.includes(day)) {
      const d = plusDays(candidate, delta);
      if (d > start) return d;
    }
  }
  // Fallback next week same time
  return plusDays(candidate, 7);
}

/** ---------- Sounds (small embedded, generated) ---------- */
/* Using WebAudio for tiny footprint; creates a short beep or chime when requested. */
const Sound = {
  /** @param {'beep'|'chime'} kind */
  play(kind='beep') {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    if (kind === 'beep') {
      o.type = 'sine'; o.frequency.setValueAtTime(880, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    } else {
      o.type = 'triangle';
      o.frequency.setValueAtTime(660, now);
      o.frequency.linearRampToValueAtTime(440, now + 0.4);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    }

    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + (kind === 'beep' ? 0.3 : 0.6));
  }
};

/** ---------- AlarmManager (stateful) ---------- */

const STORAGE_KEY = 'plursight.alarms.v1';
const SETTINGS_KEY = 'plursight.settings.v1';

/**
 * @typedef Alarm
 * @prop {string} id
 * @prop {string} time 'HH:MM'
 * @prop {string} label
 * @prop {boolean} enabled
 * @prop {number[]} repeat // 0..6 Sun..Sat
 * @prop {'beep'|'chime'} sound
 * @prop {number} lastFired // epoch ms (minute resolution) to avoid repeats
 */

function createAlarmManager() {
  /** @type {Alarm[]} */
  let alarms = [];

  /** Load persisted alarms */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      alarms = raw ? JSON.parse(raw) : [];
    } catch { alarms = []; }
  }

  /** Persist */
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  }

  /** public: list (immutable copy) */
  function list() { return alarms.map(a => ({...a})); }

  /** Add or update an alarm */
  function upsert(alarm) {
    const idx = alarms.findIndex(a => a.id === alarm.id);
    if (idx >= 0) alarms[idx] = {...alarm};
    else alarms.push({...alarm});
    save();
  }

  function add({ time, label, repeat = [], sound = 'beep' }) {
    const alarm = { id: uid(), time, label, enabled: true, repeat, sound, lastFired: 0 };
    alarms.push(alarm); save(); return alarm;
  }

  function update(id, patch) {
    const idx = alarms.findIndex(a => a.id === id);
    if (idx >= 0) { alarms[idx] = { ...alarms[idx], ...patch }; save(); }
  }

  function remove(id) {
    alarms = alarms.filter(a => a.id !== id); save();
  }

  function clear() { alarms = []; save(); }

  /** Return due alarms (that should fire now) and mark them as fired to avoid duplicates within same minute */
  function due(now = new Date()) {
    const nowMin = Math.floor(now.getTime() / 60000); // minute resolution
    const out = [];
    for (const a of alarms) {
      if (!a.enabled) continue;
      const next = computeNextTrigger(a, now);
      // If next trigger is in this minute and we haven't fired this minute
      if (Math.floor(next.getTime() / 60000) === nowMin && a.lastFired !== nowMin) {
        a.lastFired = nowMin;
        out.push(a);
      }
    }
    if (out.length) save();
    return out;
  }

  return { load, save, list, add, update, remove, clear, due };
}

/** ---------- DOM / App ---------- */

function initializeApp() {

  const currentTimeEl = document.getElementById('current-time');
  const form = document.getElementById('alarm-form');
  const editIdEl = document.getElementById('edit-id');
  const timeEl = document.getElementById('alarm-time');
  const labelEl = document.getElementById('alarm-label');
  const soundEl = document.getElementById('alarm-sound');
  const toggle24h = document.getElementById('toggle-24h');
  const resetBtn = document.getElementById('reset-btn');
  const clearBtn = document.getElementById('clear-alarms');
  const testBtn = document.getElementById('test-sound');
  const listEl = document.getElementById('alarm-list');
  const itemTpl = document.getElementById('alarm-item-template');

  const manager = createAlarmManager();
  manager.load();

  // Settings
  let settings = { use24h: false };
  try {
    const sraw = localStorage.getItem(SETTINGS_KEY);
    if (sraw) settings = { ...settings, ...JSON.parse(sraw) };
  } catch {}
  toggle24h.checked = !!settings.use24h;

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // Permissions
  if ('Notification' in window && Notification.permission === 'default') {
   
    document.addEventListener('click', requestNotificationsOnce, { once: true });
  }
  function requestNotificationsOnce() {
    try { Notification.requestPermission(); } catch {}
  }

  /** Render current time */
  function renderNow() {
    const now = new Date();
    const t = { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() };
    currentTimeEl.textContent = formatDisplayTime(t, !!settings.use24h);
  }

  /** Render alarms list */
  function renderAlarms() {
    const alarms = manager.list();
    listEl.innerHTML = '';
    if (alarms.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'alarm';
      empty.innerHTML = `<div class="meta">No alarms set.</div>`;
      listEl.appendChild(empty);
      return;
    }

    const now = new Date();
    for (const a of alarms) {
      const node = itemTpl.content.firstElementChild.cloneNode(true);

      // Time display
      const { h, m } = parseHHMM(a.time);
      node.querySelector('.time').textContent = formatDisplayTime({h,m}, !!settings.use24h);

      // Meta line: label • repeat • next
      const meta = [];
      if (a.label) meta.push(a.label);
      if (a.repeat && a.repeat.length) {
        meta.push('Repeats: ' + a.repeat.map(i => DAY_LABELS[i]).join(', '));
      } else {
        meta.push('One‑time');
      }
      const next = computeNextTrigger(a, now);
      meta.push('Next: ' + next.toLocaleString());
      node.querySelector('.meta').textContent = meta.join(' • ');

      // Toggle
      const toggle = node.querySelector('.toggle-enabled');
      toggle.checked = !!a.enabled;
      toggle.addEventListener('change', () => {
        manager.update(a.id, { enabled: !!toggle.checked });
        renderAlarms();
      });

      // Edit
      node.querySelector('.edit').addEventListener('click', () => {
        editIdEl.value = a.id;
        timeEl.value = a.time;
        labelEl.value = a.label;
        soundEl.value = a.sound || 'beep';
        // clear and set weekdays
        for (const cb of form.querySelectorAll('input[name=\"repeat\"]')) {
          cb.checked = (a.repeat || []).includes(Number(cb.value));
        }
        document.getElementById('submit-btn').textContent = 'Update alarm';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Delete
      node.querySelector('.delete').addEventListener('click', () => {
        if (confirm('Delete this alarm?')) {
          manager.remove(a.id);
          renderAlarms();
        }
      });

      listEl.appendChild(node);
    }
  }

  /** Handle form submit */
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const id = editIdEl.value || null;
    const time = timeEl.value;
    const label = labelEl.value.trim();
    const sound = soundEl.value;
    const repeat = Array.from(form.querySelectorAll('input[name=\"repeat\"]:checked')).map(el => Number(el.value));

    if (!time || !label) return;

    if (id) {
      manager.update(id, { time, label, sound, repeat, enabled: true });
    } else {
      manager.add({ time, label, sound, repeat });
    }

    form.reset();
    editIdEl.value = '';
    document.getElementById('submit-btn').textContent = 'Add alarm';
    renderAlarms();
    // Play a short feedback click
    Sound.play('beep');
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    editIdEl.value = '';
    document.getElementById('submit-btn').textContent = 'Add alarm';
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all alarms?')) { manager.clear(); renderAlarms(); }
  });

  testBtn.addEventListener('click', () => Sound.play(soundEl.value));

  toggle24h.addEventListener('change', () => {
    settings.use24h = !!toggle24h.checked;
    saveSettings();
    renderNow(); renderAlarms();
  });

  // Ticker
  renderNow(); renderAlarms();
  setInterval(() => {
    renderNow();
    // Check due alarms
    for (const a of manager.due(new Date())) {
      // ring
      Sound.play(a.sound || 'beep');
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('Alarm', { body: a.label || 'Alarm', silent: false }); } catch {}
      } else {
        alert(`Alarm: ${a.label}`);
      }
      // For one-shot alarms: disable after firing
      if (!a.repeat || a.repeat.length === 0) {
        manager.update(a.id, { enabled: false });
        renderAlarms();
      }
    }
  }, 500);
}

/** Support Node-style import for tests */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    uid, pad2, to12h, ampm, formatDisplayTime, parseHHMM, computeNextTrigger,
    createAlarmManager, initializeApp, DAY_LABELS
  };
} else {
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeApp);
    else initializeApp();
  }
}
