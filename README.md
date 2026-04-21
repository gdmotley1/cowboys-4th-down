# Cowboys 2025 Fourth Down Intelligence

A decision-support tool that plots every Dallas Cowboys 4th-down call in the
2025 regular season against the `nfl4th` win-probability model. Green dots are
calls that agreed with the model, red dots are calls that didn't, and the
takeaway section summarizes the pattern in plain English for a non-analyst
reader.

**Live site:** https://gdmotley1.github.io/cowboys-4th-down/

Built by Grant Motley for the Cowboys Strategic Football Fellow application.

## Data source

- Play-by-play from [`nflreadr`](https://github.com/nflverse/nflreadr) (the
  `nflfastR` data release).
- Fourth-down probabilities (`go_boost`, `go_wp`, `fg_wp`, `punt_wp`) from
  [`nfl4th`](https://github.com/nflverse/nfl4th) v1.0.7 — the same package
  that powers [rbsdm.com](https://rbsdm.com/stats/fourth_downs/). This means
  `go_boost` values are identical to rbsdm.com by construction.
- Units: `go_boost` is in **win-probability percentage points**, not EPA.
  Positive means the model recommends going for it; negative means it
  recommends kicking/punting.

## How the data pipeline works

1. `scripts/pull_nfl4th.R` loads 2025 pbp via `nflreadr::load_pbp(2025)`,
   filters to Dallas 4th-down regular-season plays, runs
   `nfl4th::add_4th_probs()`, and writes `data/dal_4th_raw.csv`.
2. `pull_data.py` reads that CSV, classifies each play
   (went_for_it / punted / field_goal / other), marks correctness vs the
   model's recommendation, writes `src/data/fourth_down_data.json`
   (per-play) and `src/data/summary_stats.json` (headline numbers),
   and prints a validation report.

To regenerate data from scratch:

```bash
# One-time R setup (installs nfl4th + deps)
Rscript scripts/install_nfl4th.R

# Refresh from nflverse
Rscript scripts/pull_nfl4th.R

# Re-classify and emit JSON for the UI
python pull_data.py
```

## React app

- **Framework:** Vite + React 18.
- **Chart:** `react-chartjs-2` + `chart.js` + `chartjs-plugin-annotation`.
- **Data:** static JSON imports — no API calls at runtime.

Run locally:

```bash
npm install
npm run dev          # http://localhost:5173/cowboys-4th-down/
```

Build + deploy to GitHub Pages:

```bash
npm run deploy       # builds dist/ and pushes to the gh-pages branch
```

## Validation

The data pipeline was cross-checked against NFL.com and ESPN's 2025 Cowboys
team stats:

| Metric | Pipeline | NFL.com / ESPN | Notes |
|---|---|---|---|
| Games played | 17 | 17 | ✓ |
| Punts on 4th down | 41 | 41 (ESPN total punts) | ✓ |
| Go-for-it conversions | 22 | 22 of 35 (NFL.com) | ✓ |
| Go-for-it attempts | 34 | 35 | NFL.com counts one QB kneel as an attempt; nflfastR classifies it as `qb_kneel` and nfl4th excludes it from strategic scoring. |

## Structure

```
cowboys-4th-down/
├── pull_data.py                    # Python cleaner + validation report
├── scripts/
│   ├── install_nfl4th.R            # one-time R dependency install
│   └── pull_nfl4th.R               # nfl4th::add_4th_probs runner
├── data/
│   └── dal_4th_raw.csv             # raw R output, not committed
├── src/
│   ├── index.jsx                   # React entry
│   ├── App.jsx / App.css
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── StatCards.jsx
│   │   ├── DecisionMap.jsx         # Chart.js scatter
│   │   └── Takeaway.jsx
│   └── data/
│       ├── fourth_down_data.json   # per-play, 113 rows
│       └── summary_stats.json
├── index.html
├── vite.config.js
└── package.json
```
