# CLAUDE.md — Daily Protocol App

## Project Overview
A mobile-first PWA (Progressive Web App) that serves as a daily checklist for a comprehensive health/appearance routine. The user checks off supplements, skincare steps, facial exercises, and scalp care items throughout the day. Some items rotate on a weekly schedule. The app tracks streaks and completion history.

## Tech Stack
- **React 18+** with functional components and hooks
- **Tailwind CSS** for styling (mobile-first, dark mode default)
- **Dexie.js** for IndexedDB persistence (NOT localStorage — need to store months of daily logs)
- **Vite** for bundling and dev server
- **PWA:** Vite PWA plugin for service worker + manifest (offline support, home screen install)
- **No backend.** All data is client-side IndexedDB.
- **No authentication.** Single user, single device.

## Project Structure
```
daily-protocol/
├── public/
│   ├── manifest.json
│   └── icons/            # PWA icons (192x192, 512x512)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── db.js             # Dexie.js database setup and schema
│   ├── data/
│   │   └── routineData.js  # All checklist items, schedules, instructions, product links
│   ├── hooks/
│   │   ├── useSchedule.js  # Determines which items show on a given day
│   │   ├── useStreak.js    # Calculates current/best streak
│   │   └── useTimer.js     # Interval timer logic (hold/rest/sets)
│   ├── components/
│   │   ├── TimeBlock.jsx       # Collapsible time block container
│   │   ├── ChecklistItem.jsx   # Individual tappable checklist row
│   │   ├── Timer.jsx           # Countdown/interval timer with vibration
│   │   ├── InstructionPanel.jsx # Expandable instructions + product links
│   │   ├── ProgressBar.jsx     # Daily progress indicator
│   │   ├── StreakBadge.jsx     # Current streak display
│   │   ├── CalendarHeatmap.jsx # GitHub-style completion history
│   │   └── BottomNav.jsx       # Today | History | Settings tabs
│   ├── pages/
│   │   ├── Today.jsx      # Main daily checklist view
│   │   ├── History.jsx    # Calendar heatmap + stats
│   │   └── Settings.jsx   # Schedule config, toggles, export
│   └── utils/
│       ├── scheduleLogic.js  # Day-of-week checks, alternation, conflict resolution
│       └── dateUtils.js      # Day reset logic (3 AM boundary), date formatting
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── CLAUDE.md
```

## Key Design Decisions

### Mobile-First
- Touch targets minimum 44x44px
- Full-width layout, no sidebar
- Bottom navigation (thumb-reachable)
- Large timer numbers readable at arm's length during exercises
- Dark mode default (used at 5:30 AM and 10 PM)

### Day Reset at 3:00 AM
The user takes levothyroxine at ~10:30 PM. This must count as "today." The day boundary is 3:00 AM, not midnight. All date logic must respect this. Use `dateUtils.js` to centralize this — every component that references "today" should go through this utility.

### Schedule Logic
Items have different schedule types. Handle them in `scheduleLogic.js`:
- `daily` — shows every day
- `specific_days` — shows only on configured days of the week (e.g., Mon/Wed/Fri)
- `alternating_days` — alternates with another item (use day-of-year % 2)
- `retinol_schedule` — every other night initially, nightly after toggle
- `daily_except` — shows daily except when a conflicting item is scheduled
- `mutually_exclusive_with` — only one of a pair shows on a given day

### Timer
The timer is the most-used interactive feature. Requirements:
- Big countdown number (at least 48px font)
- Start/Pause button (large, tappable)
- Skip-to-next-set button
- Vibration on hold→rest and rest→hold transitions (navigator.vibrate)
- Audio chime fallback if vibration not supported
- Works while phone screen is on but user isn't looking closely
- For interval timers: display current set number ("Set 3 of 5"), current phase ("HOLD" / "REST"), and countdown

### Data Persistence
Use Dexie.js with this schema:
```javascript
db.version(1).stores({
  dailyLogs: 'date',           // Primary key is date string YYYY-MM-DD
  settings: 'key',             // Key-value store for user settings
  streakCache: 'id'            // Single row for cached streak data
});
```

### Streak Calculation
- A day "counts" if completion percentage >= threshold (default 80%)
- Current streak = consecutive qualifying days ending today (or yesterday if today is incomplete)
- Recalculate on each day load, cache the result
- Optional items (marked `optional: true`) don't count toward percentage

## Coding Conventions
- Functional components only, no class components
- Use React hooks (useState, useEffect, useMemo, useCallback)
- Tailwind utility classes for all styling — no separate CSS files
- Keep components under 150 lines — extract sub-components if needed
- All routine data lives in `routineData.js` — components never hardcode item names/schedules
- Comments on any non-obvious schedule logic

## Important Constraints
- **No localStorage** — use IndexedDB via Dexie.js only
- **No external API calls** — everything is client-side
- **Offline-first** — service worker must cache all assets, app works without internet
- **No npm packages over 50KB gzipped** unless absolutely necessary — keep the bundle small for fast mobile load
- **Test the 3 AM day-reset logic** — this is the most likely source of subtle bugs

## The Spec
The full feature spec, complete item data (JSON), schedule rules, UI design notes, and product links are in `daily-protocol-app-spec.md` in the project root. **Read that file first before writing any code.** It contains every checklist item with its schedule type, timer configuration, instructions text, and product URLs.

## Build & Run
```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```
