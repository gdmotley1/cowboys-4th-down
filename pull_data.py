"""
Cowboys 2025 Fourth Down Intelligence — data pipeline.

Reads DAL 4th-down plays already enriched with nfl4th probs
(via scripts/pull_nfl4th.R), applies decision / correctness classification,
emits src/data/fourth_down_data.json + src/data/summary_stats.json,
and prints a validation report.

IMPORTANT: go_boost is in WP percentage points (per nfl4th / rbsdm.com),
not EPA. We use it as-is and label accordingly in the UI.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parent
CSV_IN = ROOT / "data" / "dal_4th_raw.csv"
OUT_PLAYS = ROOT / "src" / "data" / "fourth_down_data.json"
OUT_SUMMARY = ROOT / "src" / "data" / "summary_stats.json"

# Opponent team names (abbr -> display name we want in the UI)
TEAM_NAMES = {
    "ARI": "Cardinals", "ATL": "Falcons", "BAL": "Ravens", "BUF": "Bills",
    "CAR": "Panthers", "CHI": "Bears", "CIN": "Bengals", "CLE": "Browns",
    "DAL": "Cowboys", "DEN": "Broncos", "DET": "Lions", "GB": "Packers",
    "HOU": "Texans", "IND": "Colts", "JAX": "Jaguars", "KC": "Chiefs",
    "LA": "Rams", "LAC": "Chargers", "LV": "Raiders", "MIA": "Dolphins",
    "MIN": "Vikings", "NE": "Patriots", "NO": "Saints", "NYG": "Giants",
    "NYJ": "Jets", "PHI": "Eagles", "PIT": "Steelers", "SEA": "Seahawks",
    "SF": "49ers", "TB": "Buccaneers", "TEN": "Titans", "WAS": "Commanders",
}


def classify_decision(play_type: str) -> str:
    if play_type in ("pass", "run"):
        return "went_for_it"
    if play_type == "punt":
        return "punted"
    if play_type == "field_goal":
        return "field_goal"
    return "other"


def classify_correct(decision: str, go_boost: float | None) -> bool | None:
    if go_boost is None or (isinstance(go_boost, float) and math.isnan(go_boost)):
        return None
    if decision == "other":
        return None  # kneels / penalties aren't real decisions
    if go_boost > 0:
        return decision == "went_for_it"
    return decision != "went_for_it"


def field_position_phrase(yardline_100: int) -> str:
    if yardline_100 == 50:
        return "midfield"
    if yardline_100 < 50:
        return f"the opponent {yardline_100}"
    return f"their own {100 - yardline_100}"


def score_phrase(score_diff: int) -> str:
    if score_diff == 0:
        return "tied"
    if score_diff > 0:
        return f"up by {score_diff}"
    return f"down by {-score_diff}"


def action_phrase(decision: str) -> str:
    return {
        "went_for_it": "Went for it",
        "punted": "Punted",
        "field_goal": "Kicked FG",
        "other": "No play",
    }[decision]


def recommended_phrase(go_boost: float | None, decision: str) -> str | None:
    if go_boost is None or (isinstance(go_boost, float) and math.isnan(go_boost)):
        return None
    if decision == "other":
        return None
    if go_boost > 0 and decision != "went_for_it":
        return "should have gone for it"
    if go_boost <= 0 and decision == "went_for_it":
        return "should have kicked/punted"
    return None  # decision agreed with model


def situation_text(row) -> str:
    opp = row["defteam"]
    opp_name = TEAM_NAMES.get(opp, opp)
    pos = field_position_phrase(int(row["yardline_100"]))
    score = score_phrase(int(row["score_differential"]))
    action = action_phrase(row["decision"])
    rec = recommended_phrase(row["go_boost"], row["decision"])
    tail = f" ({rec})" if rec else ""
    return (
        f"Week {int(row['week'])} vs {opp_name} — "
        f"4th and {int(row['ydstogo'])} from {pos}, "
        f"{score} in Q{int(row['qtr'])} — {action}{tail}"
    )


def main() -> None:
    if not CSV_IN.exists():
        raise SystemExit(
            f"Missing {CSV_IN}. Run scripts/pull_nfl4th.R first."
        )

    df = pd.read_csv(CSV_IN)
    print(f"Loaded {len(df)} raw DAL 4th-down plays from {CSV_IN.name}")

    # --- Filter per spec: exclude no_play (not real decisions) -----------
    before = len(df)
    df = df[df["play_type"] != "no_play"].copy()
    print(f"Excluded {before - len(df)} no_play rows; {len(df)} remain")

    # --- Classify --------------------------------------------------------
    df["decision"] = df["play_type"].apply(classify_decision)
    df["correct"] = df.apply(
        lambda r: classify_correct(r["decision"], r["go_boost"]), axis=1
    )

    # human-readable situation string
    df["situation"] = df.apply(situation_text, axis=1)

    # --- Summary stats ---------------------------------------------------
    has_boost = df["go_boost"].notna() & df["decision"].isin(
        ["went_for_it", "punted", "field_goal"]
    )
    scored = df[has_boost].copy()

    total_decisions = int(len(scored))
    correct_count = int((scored["correct"] == True).sum())
    incorrect_count = int((scored["correct"] == False).sum())
    correct_pct = correct_count / total_decisions if total_decisions else 0.0

    conservative_missed = scored[
        (scored["go_boost"] > 0) & (scored["decision"] != "went_for_it")
    ]
    wp_left_on_table = float(conservative_missed["go_boost"].sum())

    went_for_it_count = int((df["decision"] == "went_for_it").sum())
    punted_count = int((df["decision"] == "punted").sum())
    field_goal_count = int((df["decision"] == "field_goal").sum())

    went_for_it_df = df[df["decision"] == "went_for_it"]
    went_for_it_converted = int(
        went_for_it_df["fourth_down_converted"].fillna(0).sum()
    )
    went_for_it_failed = int(
        went_for_it_df["fourth_down_failed"].fillna(0).sum()
    )

    summary = {
        # total decisions = scorable plays, used for the correct_pct denominator
        "total_decisions": total_decisions,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "correct_pct": round(correct_pct, 4),
        # WP points, matching rbsdm.com / nfl4th units
        "wp_left_on_table": round(wp_left_on_table, 2),
        "went_for_it_count": went_for_it_count,
        "went_for_it_converted": went_for_it_converted,
        "went_for_it_failed": went_for_it_failed,
        "punted_count": punted_count,
        "field_goal_count": field_goal_count,
        # full count including unscorable / non-strategic plays
        "total_plays": int(len(df)),
        "unscorable_plays": int(len(df) - total_decisions),
        "season": 2025,
        "season_type": "REG",
        "team": "DAL",
        "source": "nflfastR pbp + nfl4th v1.0.7",
        "notes": (
            "go_boost units are win-probability percentage points, "
            "per the nfl4th model / rbsdm.com. Unscorable plays are "
            "late-clock situations (<=15s) or qb_kneels, which the "
            "model does not evaluate as strategic decisions."
        ),
    }

    # --- Per-play export -------------------------------------------------
    plays = []
    for _, r in df.iterrows():
        def g(col):
            v = r[col]
            if isinstance(v, float) and math.isnan(v):
                return None
            return v

        plays.append({
            "game_id": g("game_id"),
            "play_id": int(g("play_id")) if g("play_id") is not None else None,
            "week": int(g("week")),
            "qtr": int(g("qtr")),
            "ydstogo": int(g("ydstogo")),
            "yardline_100": int(g("yardline_100")),
            "play_type": g("play_type"),
            "desc": g("desc"),
            "ep": g("ep"),
            "epa": g("epa"),
            "wp": g("wp"),
            "go_boost": g("go_boost"),
            "go_wp": g("go_wp"),
            "fg_wp": g("fg_wp"),
            "punt_wp": g("punt_wp"),
            "first_down_prob": g("first_down_prob"),
            "fg_make_prob": g("fg_make_prob"),
            "fourth_down_converted": int(g("fourth_down_converted") or 0),
            "fourth_down_failed": int(g("fourth_down_failed") or 0),
            "score_differential": int(g("score_differential")),
            "posteam_score": int(g("posteam_score")),
            "defteam_score": int(g("defteam_score")),
            "game_seconds_remaining": int(g("game_seconds_remaining")),
            "home_team": g("home_team"),
            "away_team": g("away_team"),
            "posteam": g("posteam"),
            "defteam": g("defteam"),
            "decision": r["decision"],
            "correct": None if r["correct"] is None else bool(r["correct"]),
            "situation": r["situation"],
        })

    OUT_PLAYS.parent.mkdir(parents=True, exist_ok=True)
    OUT_PLAYS.write_text(json.dumps(plays, indent=2))
    OUT_SUMMARY.write_text(json.dumps(summary, indent=2))
    print(f"\nWrote {OUT_PLAYS.relative_to(ROOT)} ({len(plays)} plays)")
    print(f"Wrote {OUT_SUMMARY.relative_to(ROOT)}")

    # --- Validation report ----------------------------------------------
    print("\n" + "=" * 70)
    print("VALIDATION REPORT — Cowboys 2025 Fourth Down")
    print("=" * 70)
    print(f"Total plays after no_play filter: {len(df)}")
    print(f"Plays with go_boost score: {total_decisions}")
    print(f"  correct:   {correct_count}  ({correct_pct:.1%})")
    print(f"  incorrect: {incorrect_count}  ({incorrect_count/total_decisions:.1%})")
    print()
    print("Decision type breakdown:")
    for d, n in df["decision"].value_counts().items():
        print(f"  {d}: {n}")
    print()
    print(f"Conservative-decision WP cost: {wp_left_on_table:.2f} WP pts")
    print(f"  (sum of go_boost for should-have-gone-but-didn't plays)")
    print()

    print("Top 5 most costly conservative decisions (highest go_boost where we punted/kicked):")
    top5 = conservative_missed.sort_values("go_boost", ascending=False).head(5)
    for _, r in top5.iterrows():
        print(f"  +{r['go_boost']:.2f} WP  {r['situation']}")
        print(f"           play_id={r['play_id']}  desc: {str(r['desc'])[:100]}")
    print()

    print("Manual cross-check sample — first 3 plays of each decision type:")
    for dec in ("went_for_it", "punted", "field_goal"):
        sample = df[df["decision"] == dec].head(3)
        print(f"\n  [{dec}]")
        for _, r in sample.iterrows():
            gb = r["go_boost"]
            gb_str = f"{gb:+.2f}" if pd.notna(gb) else "NA"
            print(f"    W{int(r['week'])} q{int(r['qtr'])} 4&{int(r['ydstogo'])} "
                  f"yl100={int(r['yardline_100'])} go_boost={gb_str}  correct={r['correct']}")
            print(f"      {str(r['desc'])[:110]}")

    print("\n" + "=" * 70)
    print("Cross-reference these counts against rbsdm.com/stats/fourth_downs/")
    print("for 2025 DAL before proceeding to Phase 2.")
    print("=" * 70)


if __name__ == "__main__":
    main()
