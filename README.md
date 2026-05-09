# 🌸 BloomTask

A gamified productivity web app. Add tasks, grow a flower pot as you complete them, and build a cozy garden room over time.

## How to run

Just open `index.html` in your browser. No server, no install needed.

## Files

```
bloomtask/
├── index.html   ← App structure (2 views: Today + My Bloom Garden)
├── style.css    ← All styles (cozy pixel-art aesthetic)
├── app.js       ← All logic (tasks, RNG rolls, flowers, localStorage)
└── README.md
```

## Features

### Today View
- Add tasks with name, duration, and free time window
- Tasks automatically scheduled on the mini calendar with 10-min breaks
- **RNG XP roll system** — completing a task rolls random XP (10–300) with 5 rarity tiers
- Bloom meter fills based on rolled XP (not task count)
- 🔥 Streak counter — consecutive days with completed tasks

### RNG Rarity Tiers
| Rarity    | Chance | XP Range |
|-----------|--------|----------|
| 🌿 Common     | 50%  | 10–50    |
| 🌱 Uncommon   | 28%  | 50–120   |
| ✨ Rare        | 15%  | 100–200  |
| 🌟 Epic        | 6%   | 150–250  |
| 👑 Legendary   | 1%   | 300      |

### Plant Evolution (3 Phases)
Each day's pot evolves based on Bloom XP accumulated from rolls:

| Phase | Threshold | Appearance |
|-------|-----------|------------|
| 🌱 Phase 1 — Seedling | 0–349 BP  | Terracotta pot, pink/pastel petals |
| 🌷 Phase 2 — Budding  | 350–699 BP | Purple pot, lavender star petals  |
| 🌺 Phase 3 — Full Bloom | 700+ BP  | Golden pot, sunflower petals + sparkles |

### My Bloom Garden Room
- Pixel-art cozy room with a **bookcase** (4 shelf levels), **2 wall shelves**, a **side table** (top + lower shelf), a **windowsill**, and a **floor** zone
- **Drag pots** from the unplaced tray into any furniture slot
- **Drag pots back** to the tray to rearrange
- Stats bar: total tasks done, total XP, streak, full blooms, pots grown
- All layout saved to localStorage

## Phase 2 — Add AI scheduling (optional)

Replace manual scheduling in `updateCalendar()` with a Gemini API call:

```js
async function suggestTime(taskName, duration, freeTime) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `I need to do: "${taskName}" (${duration}). My free time is ${freeTime}. Suggest a specific time slot with a 10-min break after. Reply in one line only.` }] }]
      })
    }
  );
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
```

Get a free API key at: https://aistudio.google.com

## Hosting (free)

Push to GitHub and enable GitHub Pages:  
Settings → Pages → Source: main branch / root  
Live at: `yourusername.github.io/bloomtask`
