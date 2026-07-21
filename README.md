# Neon Sequence - Cyberpunk Cognitive Memory Simulator

A modern, high-tech cognitive memory training simulator set in a dark cyberpunk theme. Replicate complex tone sequences, compete globally, level up your credentials, and customize your HUD console layout.

---

## 🚀 Live Demo & Deployment
This project is structured for zero-dependency client-side execution.
* **Suggested Hostings**: Easily deployable to Vercel, Netlify, or GitHub Pages by committing the folder root.

---

## ⚡ Features

### 1. Authentication Gates
* **Logon Sector (`index.html`)**: Interactive 3D mouse card tilt movements, simulated security scan animations, and credentials parsing.
* **Registration Portal (`register.html`)**: Real-time password validator featuring 3 glowing strength level indicators (Red/Yellow/Green).

### 2. Cognitive Memory Game Arena (`game.html`)
* **Sound Tone Sequencer**: Relies entirely on the native HTML5 Web Audio API to synthesize diatonic and chromatic notes dynamically.
* **Normal Mode (4-Pads)**: 2x2 grid layout utilizing C-Major diatonic tones (C, E, G, A#).
* **Advanced Mode (8-Pads)**: 3x3 grid layout utilizing chromatic notes. Adds Cyan, Orange, Red, and Pink pads.
* **Rules Customization**:
  * **Classic Mode**: Standard infinite sequence replication.
  * **Timer Rush**: Sets a shrinking countdown progress bar. Mismatches or timeouts trigger disconnects.
  * **Survival (3 Lives)**: Gives 3 heart indicators. Mistakes deduct 1 shield life instead of triggering instant game-overs.
  * **Daily Challenge**: Calendared seed sequences generated identical for all pilots daily (rewards 1.5x modifier XP).
* **Speed Difficulty Selector**: Easy (0.75x XP), Medium (1.0x XP), and Hard (1.5x XP).

### 3. Pilot Hubs & Telemetry
* **Telemetry Dashboard (`dashboard.html`)**: Displays XP progression bars (linear battery gauge), weekly cognitive loading line charts (animated SVG drawings), and node tooltips.
* **Standings Ledger (`leaderboard.html`)**: Gold, Silver, and Bronze podium spotlights, time filters, and dynamic usernames filtering search inputs.
* **Pilot Record (`profile.html`)**: Form editor to write player descriptions which persist in `localStorage` across reloads. Dynamically unlocks badges based on achievements.
* **HUD Settings (`settings.html`)**: Toggle ambient background music loops (deep base drone frequency layers) and graphical layout skins (Amber Gold, Synthwave Pink, Toxik Green).

---

## 🛠️ Technology Used
* **HTML5**: Semantic web layout markup and SVG icons.
* **CSS3 Custom Properties**: Ambient keyframes scanner bars, glassmorphism templates, responsive column flexings, and focus accessibility layouts.
* **JavaScript (ES6)**: Real-time form validations, localStorage database syncing, date seeding, and animation callbacks.
* **Web Audio API**: Local sine/triangle/sawtooth sound tone generators and looping drones.

---

## 📂 Folder Structure

```
d:/colourGame/
├── assets/
│   └── avatar.jpg          # Cybernetic pilot avatar image
├── 404.html                # Interrupted signal error page
├── app.js                  # Logon validations & security scan animations
├── dashboard.html          # Stats dashboard & weekly chart gauges
├── dashboard.js            # XP count-up & SVG Weekly chart renderers
├── game.html               # Memory board grid arena
├── game.js                 # Diatonic sound synthesizers & timer ticking
├── index.html              # Logon gate page
├── leaderboard.html        # Standing ledger table page
├── leaderboard.js          # Search selectors & scope filters
├── profile.html            # Bios console profile page
├── profile.js              # Word counter & badge unlocked evaluations
├── register.html           # Credential register gate page
├── register.js             # Strength indicator passwords checker
├── settings.html           # Sound toggles & theme swatches config
├── settings.js             # BGM ambient drone synthesizers & level checkers
└── style.css               # Centralized style sheet variables
```

---

## 🚀 How to Run
1. Clone or download this project repository directory.
2. Ensure you have a web browser (Chrome, Edge, Firefox, or Safari).
3. Double-click **`index.html`** to start the portal link simulation!
* *Note: To test audio components, interact with the screen first (click Start or click a pad) to comply with modern browser autoplay permissions.*

---

## 📑 Commits Pipeline Guide
Maintain clean GitHub histories using the following commit logs structure:
1. `Initial UI` - Structured basic templates for login and registration portals.
2. `Added Timer` - Programmed Timer Rush progress bars and countdown intervals in game.js.
3. `Added Score` - Synced streaks, levels, and XP progression counts.
4. `Added LocalStorage` - Integrated bios writes, theme active choices, and highest best scores.
5. `Final Deployment` - Integrated loading overlays, keyboard shortcut listeners, and 404 error gates.
