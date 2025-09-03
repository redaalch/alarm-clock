# Alarm Clock — Enhanced

A lightweight, dependency‑free alarm clock that runs right in the browser. Add one‑shot or repeating alarms, choose a sound, get desktop notifications, and keep everything saved locally. Built with **vanilla HTML/CSS/JS**; no build step required.

> **Live locally**: just open `index.html`. For desktop notifications, serve from `localhost` or HTTPS due to browser security rules.

---

## ✨ Features

- ⏱️ **Live clock** with **12/24‑hour toggle**
- ⏰ **Add / Edit / Delete** alarms
- ✅ **Enable/disable** each alarm
- 🔁 **Repeat** on selected weekdays (Mon–Sun) or run **once**
- 🔊 **Beep/Chime** sounds via the Web Audio API + **Test sound** button
- 🔔 **Desktop notifications** (with user permission)
- 💾 **Persistence** via `localStorage`
- ♿ **Accessible UI**: semantic HTML, ARIA live regions, focus rings, tabular numerals
- 🌓 **Modern theme** with CSS variables; easy to restyle
- 📦 **Zero dependencies** — works offline
- 🧪 Minimal Node tests for time helpers (optional)

---

## 🖥️ Demo / Running locally

**Quickest:** double‑click `index.html` and it will run in your default browser.

For **desktop notifications**, most browsers require a secure context (HTTPS) or `localhost`:
```bash
# Option A: Python 3 built‑in server
python3 -m http.server 5173

# Option B: Node http-server (if installed)
npx http-server -p 5173

# Then visit
http://localhost:5173
