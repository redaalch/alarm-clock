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
```

> First user interaction enables audio on some browsers (autoplay policy). The tab needs to remain open for alarms to ring.

---

## 📸 UI & Icon

The app header uses an inline SVG clock icon (themeable) instead of an emoji. You can adjust its colors by overriding CSS variables or by targeting the paths:

```css
/* Example theming */
#clock path:nth-of-type(1){ fill: #6D4534 !important; } /* body/base */
#clock path:nth-of-type(2){ fill: #0f172a !important; } /* face */
#clock path:nth-of-type(3){ fill: #e5e7eb !important; } /* hands */
#clock path:nth-of-type(4){ fill: #F9C23C !important; } /* accent */
```

---

## 🚀 Usage

1. **Set a time** (HH:MM), add a **label**, choose **days** (or none for a one‑shot alarm), pick a **sound**.
2. Press **Add alarm**.
3. Use the toggle in the list to **enable/disable**. Click **Edit** to change time/label/days. Click **Delete** to remove.
4. One‑time alarms **auto‑disable** after they fire.
5. Click **Test sound** to verify audio, and use the **24‑hour** switch to change display format.

### Notes

- **Notifications**: the browser will request permission on first use; they work on HTTPS or `localhost`.
- **Audio**: starts after a user gesture (click) due to autoplay policies.
- **Background tabs**: some mobile browsers throttle timers in background tabs; keep the tab visible for reliable firing.

---

## 🧩 Tech Stack

- **HTML/CSS/JavaScript** (no frameworks)
- **Web APIs**: `localStorage`, Web Audio API, Notifications API
- **No build tools** required

---

## 🗂 Project structure

```
.
├─ index.html        # App markup
├─ styles.css        # Modern, accessible theme (CSS variables)
├─ script.js         # Alarm logic + storage + notifications + audio
├─ CHANGELOG.md      # Changes between versions
├─ LICENSE           # MIT license
└─ tests/
   └─ run-tests.js   # Minimal Node tests for pure time helpers (optional)
```

---

## 🔧 Development

You can run a few sanity checks for the pure helper functions (requires Node):

```bash
node tests/run-tests.js
```

### Editing sounds

Sounds are generated with the **Web Audio API** for small size and reliability. If you prefer custom audio files, you can swap the generator for `<audio>` playback or extend the app to load files from `IndexedDB` (see Roadmap).

### Theming

The color palette is defined in `:root` within `styles.css`:

```css
:root {
  --bg: #0f172a;
  --panel: #111827;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --accent: #3b82f6;
  --accent-2: #22c55e;
  --danger: #ef4444;
}
```

---

## 📦 Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In your repository: **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`, pick `main` and `/root` (or `/docs` if you move files).
4. Save — your site will be live at `https://<your-user>.github.io/<repo>/`.

---

## 🧭 Roadmap

- Snooze with configurable duration
- Custom sounds (file upload) stored in IndexedDB
- PWA / Service Worker for improved background reliability
- Import/Export alarms (JSON)
- i18n for dates/times and labels

---

## ❓ FAQ / Troubleshooting

**Notifications don’t show.**  
Make sure you’re on HTTPS or `http://localhost`, and that you granted notification permission.

**No sound until I click.**  
That’s expected — browsers require a user gesture before audio can play.

**An alarm didn’t fire in the background on mobile.**  
Some mobile browsers throttle timers in background tabs. Keep the tab visible, or consider a PWA upgrade (see Roadmap).

---

## 🤝 Contributing

PRs welcome. Please keep the app dependency‑free and accessible. Linting/formatting isn’t enforced; follow the existing style (semantic HTML, small functions, clear names).

---

## 📄 License

MIT — see [`LICENSE`](LICENSE) for details.
