# Cowboys 2025 Fourth Down Intelligence

A decision-support dashboard for the Dallas Cowboys' 2025 regular-season
fourth-down calls. It plots every charted Dallas decision against the `nfl4th`
win-probability model, highlights where the staff diverged from the model, and
turns those decisions into a football-facing season story.

**Live site:** https://gdmotley1.github.io/cowboys-4th-down/

Built by Grant Motley for the Cowboys Strategic Football Fellow application.

## What The App Shows

- A custom football-field decision map: field position on the horizontal axis,
  yards-to-go on the vertical axis, and marker size based on model edge.
- View filters for all misses, conservative no-go calls, aggressive go calls,
  model-matched calls, and all charted plays.
- A drilldown panel with matchup, situation, play description, Dallas' choice,
  the model's preferred choice, and go/FG/punt win probabilities.
- A field-zone by distance heat grid that summarizes where the largest decision
  cost accumulated.
- Headline KPIs for WP surrendered, expected wins lost, model agreement, and
  miss rate.

## Data Source

- Play-by-play from [`nflreadr`](https://github.com/nflverse/nflreadr), using
  the `nflfastR` data release.
- Fourth-down probabilities (`go_boost`, `go_wp`, `fg_wp`, `punt_wp`) from
  [`nfl4th`](https://github.com/nflverse/nfl4th) v1.0.7, the same package that
  powers [rbsdm.com](https://rbsdm.com/stats/fourth_downs/).
- `go_boost` is reported in win-probability percentage points, not EPA.
  Positive values mean the model preferred going for it; negative values mean
  the model preferred kicking or punting.

## Data Pipeline

1. `scripts/pull_nfl4th.R` loads 2025 play-by-play with
   `nflreadr::load_pbp(2025)`, filters Dallas regular-season fourth-down plays,
   runs `nfl4th::add_4th_probs()`, and writes `data/dal_4th_raw.csv`.
2. `pull_data.py` classifies the actual decision, scores correctness against
   `go_boost`, and writes:
   - `src/data/fourth_down_data.json`
   - `src/data/summary_stats.json`
3. `scripts/validate_data.mjs` checks the emitted JSON for uniqueness,
   denominator consistency, decision counts, conversion counts, and WP totals.

Regenerate data from scratch:

```bash
Rscript scripts/install_nfl4th.R
Rscript scripts/pull_nfl4th.R
python pull_data.py
npm run validate:data
```

## React App

- Framework: Vite + React 18.
- Visualization: custom SVG field, decision cards, and CSS grid heatmap.
- Data: static JSON imports; no runtime API calls.

Run locally:

```bash
npm install
npm run dev
```

Build and verify:

```bash
npm run verify
```

Deploy to GitHub Pages:

```bash
npm run deploy
```

## Validation Snapshot

The current generated data is cross-checked against NFL.com and ESPN 2025
Cowboys team stats:

| Metric | Pipeline | NFL.com / ESPN | Notes |
|---|---:|---:|---|
| Games played | 17 | 17 | Match |
| Punts on fourth down | 41 | 41 | ESPN total punts |
| Go-for-it conversions | 22 | 22 of 35 | NFL.com |
| Go-for-it attempts | 34 | 35 | NFL.com counts one QB kneel as an attempt; `nflfastR` classifies it as `qb_kneel`, and `nfl4th` excludes it from strategic scoring. |

## Structure

```text
cowboys-4th-down/
|-- pull_data.py
|-- scripts/
|   |-- install_nfl4th.R
|   |-- pull_nfl4th.R
|   `-- validate_data.mjs
|-- src/
|   |-- App.jsx
|   |-- App.css
|   |-- components/
|   |   |-- DecisionGrid.jsx
|   |   |-- DetailPanel.jsx
|   |   |-- FootballField.jsx
|   |   `-- Masthead.jsx
|   |-- data/
|   |   |-- fourth_down_data.json
|   |   `-- summary_stats.json
|   `-- lib/
|       `-- decisionFilters.js
|-- index.html
|-- vite.config.js
`-- package.json
```
