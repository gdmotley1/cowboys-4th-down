const TEAM_NAMES = {
  ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills",
  CAR: "Panthers", CHI: "Bears", CIN: "Bengals", CLE: "Browns",
  DAL: "Cowboys", DEN: "Broncos", DET: "Lions", GB: "Packers",
  HOU: "Texans", IND: "Colts", JAX: "Jaguars", KC: "Chiefs",
  LA: "Rams", LAC: "Chargers", LV: "Raiders", MIA: "Dolphins",
  MIN: "Vikings", NE: "Patriots", NO: "Saints", NYG: "Giants",
  NYJ: "Jets", PHI: "Eagles", PIT: "Steelers", SEA: "Seahawks",
  SF: "49ers", TB: "Buccaneers", TEN: "Titans", WAS: "Commanders",
};
const CHOICE = {
  went_for_it: "went for it",
  punted: "punted",
  field_goal: "kicked FG",
};
function fieldPos(y) {
  if (y === 50) return "midfield";
  if (y < 50) return `opp ${y}`;
  return `own ${100 - y}`;
}
function scoreTxt(d) {
  if (d === 0) return "tied";
  if (d > 0) return `up ${d}`;
  return `down ${-d}`;
}

export default function CostliestPlays({ plays, selectedPlayId, onSelect }) {
  // Top 3 conservative misses by go_boost (model said go, Dallas didn't)
  const top = plays
    .filter(
      (p) =>
        p.go_boost != null &&
        p.go_boost > 0 &&
        p.decision !== "went_for_it" &&
        p.decision !== "other"
    )
    .sort((a, b) => b.go_boost - a.go_boost)
    .slice(0, 3);

  return (
    <div className="costliest-grid">
      {top.map((p, i) => {
        const opp = TEAM_NAMES[p.defteam] || p.defteam;
        const location = p.posteam === p.home_team ? "vs" : "at";
        return (
          <button
            key={p.play_id}
            className={`costliest-card${
              p.play_id === selectedPlayId ? " is-selected" : ""
            }`}
            onClick={() => onSelect(p)}
            type="button"
          >
            <div className="costliest-head">
              <div className="costliest-rank num">#{i + 1}</div>
              <div className="costliest-cost num">+{p.go_boost.toFixed(2)} WP</div>
            </div>
            <h4 className="costliest-matchup">
              Week {p.week} {location} {opp}
            </h4>
            <p className="costliest-situation">
              Q{p.qtr}, {scoreTxt(p.score_differential)} — 4th &amp; {p.ydstogo} from{" "}
              {fieldPos(p.yardline_100)}. Dallas {CHOICE[p.decision]}.
            </p>
            <div className="costliest-verdict">
              Model said <em>/</em> Go for it
            </div>
          </button>
        );
      })}
    </div>
  );
}
