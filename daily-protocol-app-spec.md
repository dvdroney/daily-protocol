# Daily Protocol App — Claude Code Build Spec

## Overview

Build a mobile-first progressive web app (PWA) that serves as a daily checklist for a comprehensive health/appearance routine. The routine includes supplements, skincare, facial exercises, and scalp care — all with specific timing throughout the day. Some items rotate on a weekly schedule. The app tracks streaks and completion history.

## Tech Stack Recommendation

- **Frontend:** React + Tailwind CSS (or Next.js if you want SSR)
- **Storage:** IndexedDB via Dexie.js or similar (client-side, no backend needed for v1) — the app needs to persist data across browser sessions
- **PWA:** Service worker + manifest so it can be added to home screen and work offline
- **No authentication needed for v1** — single user, local device

## Core Features

### 1. Daily Checklist
- Items grouped by time block (Wake, Pre-Run, Post-Workout/Shower, Breakfast, Lunch, Afternoon, Dinner, Evening Wind-Down, Evening Routine, Bedtime)
- Each item is tappable to check off
- Checked items get a visual strike-through or dimming but remain visible
- Progress bar or fraction at the top showing "17/23 completed" for the day
- Day resets at a configurable time (default: 3:00 AM to handle late-night items like levo)

### 2. Smart Weekly Schedule Logic
Some items only appear on certain days. The app needs to manage this:

| Item | Schedule | Logic |
|---|---|---|
| Dandruff shampoo (CeraVe Anti-Dandruff) | 3x/week | Mon, Wed, Fri (user-configurable) |
| Regular shampoo or water-only rinse | Other days | Tue, Thu, Sat, Sun |
| Retinol | Every other night → then nightly after week 3 | Alternating days initially, toggle to switch to nightly |
| Exfoliation (AHA/BHA peel) | 2x/week, NOT on retinol nights | Auto-schedule on non-retinol evenings |
| Derma roller | 1x/week | e.g., Saturday — NOT same day as rosemary oil |
| Rosemary oil scalp treatment | Daily EXCEPT derma roller day | 6 days/week |
| Lateral thumbpull vs. basic thumbpull | Alternating days | Odd days = basic, even days = lateral (or toggle) |
| L-Carnitine 2nd dose | Daily, but note "take before gym" on lift day | User marks which day is lift day (configurable) |

The user should be able to configure which days of the week each rotating item falls on in a settings screen.

### 3. Expandable Instructions
Each checklist item should be tappable to expand and show:
- Brief description of what to do
- Form cues / technique reminders for exercises
- Product name + link for skincare/supplement items
- Duration if applicable (e.g., "Hold 30 seconds × 5 reps")

### 4. Exercise Timers
For items that have timed holds or sets, include an inline timer:
- **Thumbpulling:** 30 sec hold, 10 sec rest, 5 reps — show a countdown timer that cycles through the sets automatically with a chime/vibration between hold and rest
- **Tongue push-ups:** 10 sec hold, 5 sec rest, 8 reps
- **Tongue chewing:** 60 sec on, 15 sec rest, 2 rounds
- **Chin tucks:** 5 sec hold, 2 sec rest, 15 reps
- **Lying chin retractions:** 5 sec hold, 2 sec rest, 15 reps
- **Buteyko breathing:** simple stopwatch (user holds as long as comfortable, no fixed time)
- **Scalp massage:** 2 min total countdown
- **Dandruff shampoo contact time:** 3-5 min countdown (start it in the shower, alert when done)

Timer UI should be simple: big countdown number, start/pause button, skip-to-next-set button. Vibrate on transitions if supported.

### 5. Streak Tracking & History
- **Daily completion percentage** stored for each day
- **Current streak** = consecutive days with ≥80% completion (configurable threshold)
- **Best streak** shown alongside current
- **Calendar heat map** view — shows last 30-90 days, color-coded by completion % (like GitHub contribution graph)
- **Weekly summary** — average completion %, most-skipped items

### 6. Onboarding / Phase-In Logic (Nice to Have)
The full routine has ~23 items per day. For someone starting from scratch, the app could support a "phase-in" mode:
- **Week 1-2:** Only show skincare basics (cleanser, moisturizer, sunscreen) + mewing + chin tucks + supplements
- **Week 3-4:** Add retinol, vitamin C serum, rosemary oil, thumbpulling
- **Week 5+:** Full routine unlocked
- User can skip phase-in and unlock everything immediately

---

## Complete Routine Data

### TIME BLOCK: Wake (~5:30-6:00 AM)
```json
[
  {
    "id": "buteyko",
    "name": "Buteyko Nose-Unblocking Exercise",
    "duration_minutes": 2,
    "timer_type": "stopwatch",
    "schedule": "daily",
    "instructions": "Sit upright. Small gentle breath in (2 sec) and out (3 sec) through nose. Pinch nose shut, nod head until moderate-to-strong urge to breathe (~70% max). Release, breathe gently through nose for 30-60 sec. Repeat up to 5 times.",
    "category": "breathing"
  },
  {
    "id": "saline_rinse",
    "name": "Nasal Saline Rinse (optional)",
    "schedule": "daily",
    "instructions": "NeilMed sinus rinse or neti pot. Helps with congestion and allergies.",
    "category": "congestion",
    "optional": true
  }
]
```

### TIME BLOCK: Pre-Run (~6:00 AM)
```json
[
  {
    "id": "lcarnitine_am",
    "name": "Acetyl-L-Carnitine (500mg)",
    "schedule": "daily",
    "instructions": "Take 1 cap with granola bar before run.",
    "category": "supplement",
    "product": "Momentous Acetyl-L-Carnitine"
  }
]
```

### TIME BLOCK: Post-Workout Shower (~7:15-7:30 AM)
```json
[
  {
    "id": "shower",
    "name": "Shower (lukewarm water)",
    "schedule": "daily",
    "instructions": "Lukewarm water — never hot. Strips oils from dry Hashimoto's skin.",
    "category": "hygiene"
  },
  {
    "id": "dandruff_shampoo",
    "name": "Dandruff Shampoo (CeraVe Anti-Dandruff)",
    "schedule": "specific_days",
    "default_days": ["monday", "wednesday", "friday"],
    "timer_type": "countdown",
    "timer_seconds": 240,
    "timer_label": "Shampoo contact time",
    "instructions": "Lather into scalp, LEAVE ON 3-5 min while washing body. Pyrithione zinc needs contact time. Rinse, follow with conditioner.",
    "category": "hair",
    "product": "CeraVe Anti-Dandruff Hydrating Shampoo",
    "product_url": "https://www.amazon.com/CeraVe-Hydrating-Pyrithione-Niacinamide-Hyaluronic/dp/B0DV43L7J8"
  },
  {
    "id": "gentle_shampoo",
    "name": "Gentle Shampoo or Water Rinse Only",
    "schedule": "specific_days",
    "default_days": ["tuesday", "thursday", "saturday", "sunday"],
    "instructions": "Skip shampooing entirely (just rinse with water) or use CeraVe Gentle Hydrating Shampoo. Preserves natural scalp oils.",
    "category": "hair",
    "mutually_exclusive_with": "dandruff_shampoo"
  },
  {
    "id": "scalp_massage",
    "name": "Scalp Massage",
    "schedule": "daily",
    "duration_minutes": 2,
    "timer_type": "countdown",
    "timer_seconds": 120,
    "instructions": "Do in or right after shower. Three techniques:\n1. CIRCULAR KNEADING (60 sec): All 10 fingertip pads on scalp, press firmly so skin moves over bone creating folds. Small slow circles, front hairline → crown → sides → nape. Extra time on thinning areas.\n2. PINCH AND LIFT (30 sec): Grab scalp between fingertips and palm heel, squeeze to crease, release. Grid pattern across whole scalp.\n3. SCALP SHAKE (30 sec): Both hands flat on sides of head, grip firmly, shake rapidly. Scalp should slide over skull.",
    "category": "hair"
  }
]
```

### TIME BLOCK: Morning Skincare (~7:30 AM)
```json
[
  {
    "id": "vitc_serum",
    "name": "Vitamin C Serum",
    "schedule": "daily",
    "instructions": "2-3 pumps Timeless C+E Ferulic to face and neck while still slightly damp from shower. Pat in gently.",
    "category": "skincare",
    "product": "Timeless Vitamin C+E+Ferulic Acid Serum",
    "product_url": "https://www.amazon.com/Timeless-Skin-Care-20-Vitamin/dp/B0036BI56G"
  },
  {
    "id": "moisturizer_am",
    "name": "Moisturizer",
    "schedule": "daily",
    "instructions": "CeraVe Moisturizing Cream on slightly damp skin.",
    "category": "skincare",
    "product": "CeraVe Moisturizing Cream",
    "product_url": "https://www.amazon.com/CeraVe-Moisturizing-Contains-Hydrating-Cleanser/dp/B08FZZPKTF"
  },
  {
    "id": "sunscreen",
    "name": "Sunscreen SPF 30+",
    "schedule": "daily",
    "instructions": "EltaMD UV Clear SPF 46 or CeraVe AM SPF 30. Every single day, even winter, even cloudy. #1 anti-aging product.",
    "category": "skincare",
    "product": "EltaMD UV Clear SPF 46",
    "product_url": "https://www.amazon.com/EltaMD-Clear-Facial-Sunscreen-Broad-Spectrum/dp/B002MSN3QQ"
  }
]
```

### TIME BLOCK: Breakfast (~7:45-8:00 AM)
```json
[
  {
    "id": "omega3",
    "name": "Omega-3 (1,600mg EPA+DHA)",
    "schedule": "daily",
    "instructions": "2 softgels with breakfast containing fat. Fat-soluble — needs dietary fat for absorption.",
    "category": "supplement",
    "product": "Momentous Omega-3"
  },
  {
    "id": "vitd",
    "name": "Vitamin D (5,000 IU)",
    "schedule": "daily",
    "instructions": "1 tablet with breakfast. Fat-soluble. Important for Hashimoto's — many autoimmune patients are deficient.",
    "category": "supplement",
    "product": "Klean Athlete Klean-D 5000 IU"
  },
  {
    "id": "astaxanthin",
    "name": "Astaxanthin (6mg)",
    "schedule": "daily",
    "instructions": "1 softgel with breakfast. Fat-soluble carotenoid. Protects against UV and exercise-induced oxidative stress. Pairs with topical Vitamin C for internal + external antioxidant protection.",
    "category": "supplement",
    "product": "Sports Research Astaxanthin"
  }
]
```

### TIME BLOCK: Morning Facial Exercises (~8:00-8:15 AM)
```json
[
  {
    "id": "chin_tuck_am",
    "name": "Chin Tucks + Posture Set",
    "schedule": "daily",
    "duration_minutes": 2,
    "timer_type": "interval",
    "sets": 15,
    "hold_seconds": 5,
    "rest_seconds": 2,
    "instructions": "Stand back against wall. Feet ~6in out. Butt, upper back, back of head all touching. Shoulders rolled back. Pull chin straight back toward wall (double chin). Don't tilt head. Hold 5 sec, release 2 sec. 15 reps. Should feel stretch at base of skull and front neck engaging.",
    "category": "exercise"
  },
  {
    "id": "mewing_set_am",
    "name": "Mewing Posture Set",
    "schedule": "daily",
    "duration_minutes": 2,
    "timer_type": "countdown",
    "timer_seconds": 120,
    "instructions": "Swallow — at the peak, tongue is suctioned flat to palate. Hold that position. Key: get BACK THIRD of tongue up (hardest part). Gentle suction, not forceful pressing. Teeth lightly touching or barely apart. Jaw relaxed. Lips sealed. Breathe through nose. Practice 5-6 intentional swallows during this time.",
    "category": "exercise"
  },
  {
    "id": "thumbpull_basic_am",
    "name": "Thumbpulling — Basic (Upward)",
    "schedule": "alternating_days",
    "alternates_with": "thumbpull_lateral_am",
    "duration_minutes": 4,
    "timer_type": "interval",
    "sets": 5,
    "hold_seconds": 30,
    "rest_seconds": 10,
    "instructions": "Wash hands. Stand in chin-tuck posture (critical). Place both thumbs on hard palate, pads up, just behind front teeth on either side of midline ridge. Apply steady UPWARD pressure — lift, don't push outward. Hold 30 sec, rest 10 sec, 5 reps. Breathe through nose. NEVER press on teeth — only palate bone.",
    "category": "exercise"
  },
  {
    "id": "thumbpull_lateral_am",
    "name": "Thumbpulling — Lateral (Outward + Up)",
    "schedule": "alternating_days",
    "alternates_with": "thumbpull_basic_am",
    "duration_minutes": 4,
    "timer_type": "interval",
    "sets": 5,
    "hold_seconds": 30,
    "rest_seconds": 10,
    "instructions": "Same posture setup as basic. Place one thumb on left side of palate, one on right. Apply gentle OUTWARD and UPWARD pressure — widening the palate. Hold 30 sec, rest 10 sec, 5 reps.",
    "category": "exercise"
  },
  {
    "id": "tongue_pushups",
    "name": "Tongue Push-Ups",
    "schedule": "daily",
    "duration_minutes": 2,
    "timer_type": "interval",
    "sets": 8,
    "hold_seconds": 10,
    "rest_seconds": 5,
    "instructions": "Press ENTIRE tongue (front, middle, back) as hard as you can against roof of mouth. Maximum force. Hold 10 sec, rest 5 sec. 8 reps.\n\nAlternate with TONGUE CHEWING: Tongue tip behind front teeth on palate. Press middle/back up firmly. Make chewing/kneading motion against palate. 60 sec on, 15 sec rest, 2 rounds.",
    "category": "exercise"
  }
]
```

### TIME BLOCK: Lunch (Mid-day)
```json
[
  {
    "id": "iron",
    "name": "Iron (27mg)",
    "schedule": "daily",
    "instructions": "Take AWAY from dairy, coffee, and calcium. Iron competes with calcium. Coffee tannins block iron. Important for runners (foot-strike hemolysis) and Hashimoto's patients. Aim ferritin 50-100+.",
    "category": "supplement",
    "product": "Klean Athlete Klean Iron"
  }
]
```

### TIME BLOCK: Afternoon
```json
[
  {
    "id": "lcarnitine_pm",
    "name": "Acetyl-L-Carnitine (500mg) — 2nd dose",
    "schedule": "daily",
    "instructions": "Take with or without food. On lift day, take ~30-60 min before gym. Don't take too late if it affects sleep.",
    "category": "supplement",
    "product": "Momentous Acetyl-L-Carnitine",
    "lift_day_note": "Take before gym today"
  }
]
```

### TIME BLOCK: Dinner (~6:00-6:30 PM)
```json
[
  {
    "id": "zinc",
    "name": "Zinc",
    "schedule": "daily",
    "instructions": "Take with food to avoid nausea. Separated from iron by several hours. Supports thyroid conversion (T4→T3), skin, hair, immune function.",
    "category": "supplement",
    "product": "Klean Athlete Klean Zinc"
  }
]
```

### TIME BLOCK: Evening Wind-Down (~7:30-8:00 PM)
```json
[
  {
    "id": "magnesium",
    "name": "Magnesium Bisglycinate (200mg)",
    "schedule": "daily",
    "instructions": "1 scoop in water. Calming — supports sleep. Must be 2.5-3+ hours before levothyroxine at bedtime.",
    "category": "supplement",
    "product": "Thorne Magnesium Bisglycinate"
  }
]
```

### TIME BLOCK: Evening Routine (~8:30-9:30 PM)
```json
[
  {
    "id": "micellar_water",
    "name": "Micellar Water Cleanse",
    "schedule": "daily",
    "instructions": "Simple Micellar Water on cotton pad. Removes sunscreen and daily grime. NO shower in the evening — preserves rosemary oil treatment and avoids retinol irritation from steam.",
    "category": "skincare",
    "product": "Simple Micellar Water",
    "product_url": "https://www.amazon.com/Simple-Micellar-Cleansing-Water-Fl/dp/B01708GR14"
  },
  {
    "id": "cleanser_pm",
    "name": "Gentle Cleanser",
    "schedule": "daily",
    "instructions": "CeraVe Hydrating Cleanser. Lukewarm water.",
    "category": "skincare",
    "product": "CeraVe Hydrating Facial Cleanser",
    "product_url": "https://www.amazon.com/CeraVe-Hydrating-Facial-Cleanser-Fragrance/dp/B01MSSDEPK"
  },
  {
    "id": "retinol",
    "name": "Retinol",
    "schedule": "retinol_schedule",
    "schedule_note": "Every other night for weeks 1-3, then nightly",
    "instructions": "Pea-sized amount to DRY face. Expect some dryness/peeling initially (retinization). Use more moisturizer if needed.",
    "category": "skincare",
    "product": "The Ordinary Retinol 0.5% in Squalane",
    "product_url": "https://www.amazon.com/Ordinary-Retinol-0-5-Squalane-30ml/dp/B07L1P7GCJ"
  },
  {
    "id": "exfoliation",
    "name": "Exfoliation (AHA/BHA Peel)",
    "schedule": "specific_days",
    "default_days": ["tuesday", "saturday"],
    "schedule_note": "2x/week, NEVER on retinol nights",
    "conflicts_with": "retinol",
    "instructions": "Use in place of regular cleanser. The Ordinary AHA 30% + BHA 2% peeling solution.",
    "category": "skincare",
    "product": "The Ordinary AHA/BHA Peeling Solution",
    "product_url": "https://www.amazon.com/Ordinary-AHA-30-BHA-Peeling/dp/B071D4D5DT"
  },
  {
    "id": "moisturizer_pm",
    "name": "Heavy Moisturizer",
    "schedule": "daily",
    "instructions": "Layer on after retinol absorbs for a minute. Slugging (thin Aquaphor layer) on really dry winter nights.",
    "category": "skincare",
    "product": "CeraVe Moisturizing Cream",
    "product_url": "https://www.amazon.com/CeraVe-Moisturizing-Cream-Daily-Moisturizer/dp/B00TTD9BRC"
  },
  {
    "id": "rosemary_oil",
    "name": "Rosemary Oil Scalp Treatment",
    "schedule": "daily_except",
    "except_when": "derma_roller",
    "instructions": "3-5 drops rosemary essential oil in ~1 tbsp jojoba or castor oil. Apply to crown/thinning areas. Massage using circular kneading and pinch-and-lift. Leave in overnight. Towel on pillow.",
    "category": "hair",
    "product": "Mielle Rosemary Mint Scalp Oil",
    "product_url": "https://www.amazon.com/Mielle-Rosemary-Mint-Scalp-Strengthening/dp/B07N7PK9QK"
  },
  {
    "id": "mewing_set_pm",
    "name": "Mewing Re-set",
    "schedule": "daily",
    "duration_minutes": 1,
    "timer_type": "countdown",
    "timer_seconds": 60,
    "instructions": "Conscious check-in. Full tongue suction on palate, lips sealed, teeth lightly touching. Practice 5-6 intentional swallows to lock in position.",
    "category": "exercise"
  },
  {
    "id": "lying_chin_retraction",
    "name": "Lying Chin Retractions",
    "schedule": "daily",
    "duration_minutes": 2,
    "timer_type": "interval",
    "sets": 15,
    "hold_seconds": 5,
    "rest_seconds": 2,
    "instructions": "Lie face-up on floor, NO pillow. Press back of head into floor while tucking chin (double chin against floor). Hold 5 sec, release. 15 reps. Feel deep front neck flexors working.",
    "category": "exercise"
  },
  {
    "id": "thumbpull_basic_pm",
    "name": "Thumbpulling Session 2 — Basic (Upward)",
    "schedule": "alternating_days",
    "alternates_with": "thumbpull_lateral_pm",
    "duration_minutes": 4,
    "timer_type": "interval",
    "sets": 5,
    "hold_seconds": 30,
    "rest_seconds": 10,
    "instructions": "Same as morning. 5 reps of 30-sec holds. Strict posture. After 8 weeks of 2x/day, can drop to 1x/day.",
    "category": "exercise"
  },
  {
    "id": "thumbpull_lateral_pm",
    "name": "Thumbpulling Session 2 — Lateral (Outward + Up)",
    "schedule": "alternating_days",
    "alternates_with": "thumbpull_basic_pm",
    "duration_minutes": 4,
    "timer_type": "interval",
    "sets": 5,
    "hold_seconds": 30,
    "rest_seconds": 10,
    "instructions": "Same as morning lateral version. After 8 weeks of 2x/day, can drop to 1x/day.",
    "category": "exercise"
  },
  {
    "id": "facial_massage",
    "name": "Facial Massage / Lymphatic Drainage",
    "schedule": "daily",
    "duration_minutes": 3,
    "timer_type": "countdown",
    "timer_seconds": 180,
    "instructions": "With jojoba oil:\n1. FOREHEAD: Center → sweep outward to temples. 5 passes.\n2. CHEEKS: Nose sides → sweep along cheekbones to ears. 5 passes.\n3. JAWLINE: Chin center → sweep along jaw to below ears. 5 passes.\n4. NECK: Stroke DOWNWARD from below ears to collarbone. 5 passes each side.\n5. SINUS: Small circles along brow, down nose sides, under eyes, over cheekbones.",
    "category": "exercise"
  },
  {
    "id": "mouth_tape",
    "name": "Apply Mouth Tape",
    "schedule": "daily",
    "instructions": "Small piece of Hostage Tape or 3M Micropore over center of lips. Trains nasal breathing during sleep. Start with center-lip only.",
    "category": "sleep"
  }
]
```

### TIME BLOCK: Bedtime (~10:00-10:30 PM)
```json
[
  {
    "id": "levothyroxine",
    "name": "Levothyroxine",
    "schedule": "daily",
    "instructions": "Empty stomach with full glass of water. At least 3-4 hours after food, 2.5-3 hours after magnesium. Nothing after — just sleep.",
    "category": "medication",
    "critical": true
  }
]
```

### WEEKLY ITEMS (show on their scheduled day)
```json
[
  {
    "id": "derma_roller",
    "name": "Derma Roller on Scalp",
    "schedule": "specific_days",
    "default_days": ["saturday"],
    "conflicts_with": "rosemary_oil",
    "instructions": "0.5mm derma roller on crown/thinning areas. Roll vertically, horizontally, diagonally — 4-5 passes each direction. Wait 24 hours before rosemary oil.",
    "category": "hair"
  }
]
```

---

## Schedule Logic Rules

1. **Retinol schedule:** Start as every-other-night. After user toggles "retinol adjusted" (or after 21 days), switch to nightly. When retinol is scheduled, exfoliation should NOT appear.
2. **Exfoliation:** 2x/week on user-configured days, but automatically hidden if that day is a retinol night.
3. **Dandruff shampoo vs. gentle wash:** Mutually exclusive. Show one or the other based on the day.
4. **Thumbpull alternation:** Basic on odd-numbered days of the routine (day 1, 3, 5...), lateral on even. Both AM and PM sessions match (same type both times on a given day).
5. **Derma roller day:** Rosemary oil is automatically hidden on this day.
6. **Lift day:** User configures which day(s) they lift. On lift day, the afternoon L-Carnitine item shows a note: "Take 30-60 min before gym."

---

## UI Design Notes

### Mobile-First Layout
- **Top bar:** Date, day streak count, daily progress fraction
- **Main view:** Scrollable list of time blocks, each collapsible. Current/next time block auto-expanded.
- **Bottom nav:** Today (checklist) | History (calendar heat map) | Settings
- **Color scheme:** Dark mode default (easier on eyes for early morning and bedtime use). Clean, minimal. Category color coding: supplements = blue, skincare = green, exercises = orange, hair = purple, medication = red.

### Interaction Patterns
- **Tap item** = toggle complete
- **Long press or expand arrow** = show instructions + timer (if applicable)
- **Timer:** Big countdown number, start/pause button, skip button. Vibrate on set transitions.
- **Swipe left on item** = mark as "skipped" (different from unchecked — tracked separately in history)

### History / Calendar View
- GitHub-style heat map grid: rows = days of week, columns = weeks
- Color intensity = completion percentage (0% = gray, 50% = light green, 100% = dark green)
- Tap a day to see that day's checklist with what was completed/skipped/missed
- Current streak and best streak displayed prominently
- "Most skipped items" section to identify weak spots

### Settings Screen
- Configure which days for: dandruff shampoo, exfoliation, derma roller, lift day
- Toggle retinol from "every other night" to "nightly"
- Toggle phase-in mode on/off
- Set day-reset time (default 3:00 AM)
- Streak threshold (default 80%)
- Export data option (JSON)

---

## Data Model

```
DailyLog {
  date: string (YYYY-MM-DD)
  items: [
    {
      item_id: string
      status: "completed" | "skipped" | "missed"
      completed_at: timestamp | null
    }
  ]
  completion_percentage: number
}

UserSettings {
  dandruff_days: string[] (days of week)
  exfoliation_days: string[]
  derma_roller_day: string
  lift_days: string[]
  retinol_mode: "alternating" | "nightly"
  retinol_start_date: string (to auto-switch after 21 days)
  phase_in_mode: boolean
  phase_in_start_date: string
  day_reset_hour: number (0-23, default 3)
  streak_threshold: number (0-100, default 80)
}

StreakData {
  current_streak: number
  best_streak: number
  last_completed_date: string
}
```

---

## Key Product Links (for instructions/reference panels)

| Product | URL |
|---|---|
| CeraVe Hydrating Facial Cleanser | https://www.amazon.com/CeraVe-Hydrating-Facial-Cleanser-Fragrance/dp/B01MSSDEPK |
| CeraVe Moisturizing Cream | https://www.amazon.com/CeraVe-Moisturizing-Contains-Hydrating-Cleanser/dp/B08FZZPKTF |
| Timeless Vitamin C+E+Ferulic | https://www.amazon.com/Timeless-Skin-Care-20-Vitamin/dp/B0036BI56G |
| EltaMD UV Clear SPF 46 | https://www.amazon.com/EltaMD-Clear-Facial-Sunscreen-Broad-Spectrum/dp/B002MSN3QQ |
| CeraVe AM SPF 30 | https://www.amazon.com/CeraVe-Facial-Moisturizing-Lotion-AM/dp/B00F97FHAW |
| The Ordinary Retinol 0.5% | https://www.amazon.com/Ordinary-Retinol-0-5-Squalane-30ml/dp/B07L1P7GCJ |
| Simple Micellar Water | https://www.amazon.com/Simple-Micellar-Cleansing-Water-Fl/dp/B01708GR14 |
| The Ordinary AHA/BHA Peel | https://www.amazon.com/Ordinary-AHA-30-BHA-Peeling/dp/B071D4D5DT |
| CeraVe Anti-Dandruff Shampoo | https://www.amazon.com/CeraVe-Hydrating-Pyrithione-Niacinamide-Hyaluronic/dp/B0DV43L7J8 |
| CeraVe Anti-Dandruff Set | https://www.amazon.com/CeraVe-Conditioner-Pyrithione-Hyaluronic-Niacinamide/dp/B0GLQXRTH8 |
| Mielle Rosemary Mint Scalp Oil | https://www.amazon.com/Mielle-Rosemary-Mint-Scalp-Strengthening/dp/B07N7PK9QK |
| Botanic Hearth Rosemary Oil | https://www.amazon.com/Botanic-Hearth-Strenghtening-Nourishing-Volumizing/dp/B0C6XJMSGP |
| Handcraft Jojoba Oil | https://www.amazon.com/Handcraft-Blends-Organic-Jojoba-Oil/dp/B07NQ7VPRC |

---

## Notes for the Developer (Claude Code)

- **This is a real routine someone will use every day.** Prioritize reliability and speed over flashiness. The app needs to load instantly, work offline, and never lose data.
- **The timer is the most-used interactive feature.** Make it dead simple — big numbers, big buttons, vibration feedback. It needs to work while the phone screen is on but the user is physically doing exercises (not looking at the screen closely).
- **Don't over-engineer the scheduling.** A simple lookup table of "what shows on what day" is fine. The rules aren't complex enough to need a full scheduling engine.
- **Test the day-reset logic carefully.** Bedtime levo at 10:30 PM should count for "today" even though it's late. The 3 AM reset handles this.
- **IndexedDB for persistence.** LocalStorage has size limits. IndexedDB via Dexie.js is the right call for storing months of daily logs.
- **PWA manifest + service worker** so it can be installed on the home screen and works without internet.
