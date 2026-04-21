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

function fieldPos(y) {
  if (y === 50) return "midfield";
  if (y < 50) return `opp ${y} yard line`;
  return `own ${100 - y} yard line`;
}
function scoreTxt(d) {
  if (d === 0) return "tied";
  if (d > 0) return `leading by ${d}`;
  return `trailing by ${-d}`;
}
function pct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return `${(v * 100).toFixed(1)}%`;
}
function timeTxt(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.max(0, secs - m * 60);
  return `${m}:${String(s).padStart(2, "0")} remaining in regulation`;
}

const CHOICE_LABEL = {
  went_for_it: "Went for it",
  punted: "Punted",
  field_goal: "Kicked FG",
  other: "Clock-kill",
};

export default function DetailPanel({ play }) {
  if (!play) {
    return (
      <div className="detail-shell">
        <div className="detail-empty">
          <strong>Click any play on the field</strong> — or any of the three
          costliest below — to see the full win-probability breakdown for that
          decision.
        </div>
      </div>
    );
  }

  const oppName = TEAM_NAMES[play.defteam] || play.defteam;

  // Three-option breakdown — rows for options with a valid WP.
  const options = [
    {
      id: "go",
      name: "Go for it",
      wp: play.go_wp,
      underText: play.first_down_prob != null
        ? `${pct(play.first_down_prob)} first-down chance`
        : null,
      chosen: play.decision === "went_for_it",
    },
    {
      id: "fg",
      name: "Kick field goal",
      wp: play.fg_wp,
      underText: play.fg_make_prob != null
        ? `${pct(play.fg_make_prob)} make chance`
        : null,
      chosen: play.decision === "field_goal",
    },
    {
      id: "punt",
      name: "Punt",
      wp: play.punt_wp,
      underText: null,
      chosen: play.decision === "punted",
    },
  ];

  const validWPs = options.map((o) => o.wp).filter((v) => v != null);
  const maxWP = validWPs.length ? Math.max(...validWPs) : null;
  const minWP = validWPs.length ? Math.min(...validWPs) : null;
  const range = maxWP != null && minWP != null ? Math.max(0.0001, maxWP - minWP) : 0;

  const modelChoice = options.find((o) => o.wp != null && o.wp === maxWP);
  const isDallasCorrect = modelChoice && modelChoice.chosen;

  return (
    <div className="detail-shell">
      <div className="detail-inner">
        {/* Left column: situation + play description + chips */}
        <div className="detail-left">
          <div className="detail-kicker">
            Decision Breakdown · Week {play.week}
          </div>
          <h3 className="detail-matchup">
            {play.posteam === play.home_team
              ? `${oppName} at Cowboys`
              : `Cowboys at ${oppName}`}
          </h3>
          <p className="detail-situation">
            <span className="hl">Q{play.qtr}</span> · 4th &amp;{" "}
            <span className="hl">{play.ydstogo}</span> from{" "}
            <span className="hl">{fieldPos(play.yardline_100)}</span> ·{" "}
            <span className="hl">{scoreTxt(play.score_differential)}</span>
            <br />
            {timeTxt(play.game_seconds_remaining)}
          </p>

          {play.desc && (
            <p className="detail-desc">&ldquo;{play.desc}&rdquo;</p>
          )}

          <div className="detail-verdict">
            <span className="chip chose">
              Dallas: {CHOICE_LABEL[play.decision]}
            </span>
            {modelChoice && (
              <span className="chip recommended">
                Model: {modelChoice.name}
              </span>
            )}
            {play.correct != null && (
              <span
                className={`chip outcome-${play.correct ? "correct" : "incorrect"}`}
              >
                {play.correct ? "Matched model" : "Missed opportunity"}
              </span>
            )}
          </div>
        </div>

        {/* Right column: three-option WP comparison */}
        <div className="detail-right">
          <p className="options-kicker">
            {isDallasCorrect
              ? "Win-probability by option (Dallas chose the best)"
              : `Win-probability by option (${play.go_boost != null
                  ? `${play.go_boost >= 0 ? "+" : ""}${play.go_boost.toFixed(2)} WP cost`
                  : "model not scored"
                })`}
          </p>

          <table className="options-table num">
            <thead>
              <tr>
                <th>Option</th>
                <th>Win probability</th>
                <th>Underlying chance</th>
              </tr>
            </thead>
            <tbody>
              {options.map((o) => {
                const isBest = o.wp != null && o.wp === maxWP;
                const barPct = o.wp != null
                  ? (range > 0 ? ((o.wp - minWP) / range) * 100 : 100)
                  : 0;
                return (
                  <tr
                    key={o.id}
                    className={[
                      isBest ? "is-best" : "",
                      o.chosen ? "is-chosen" : "",
                    ].join(" ").trim()}
                  >
                    <td className="opt-name">
                      {o.chosen && <span className="opt-chose-marker" />}
                      {o.name}
                    </td>
                    <td>
                      {o.wp != null ? (
                        <>
                          <span className="wp-bar">
                            <span style={{ width: `${Math.max(3, barPct)}%` }} />
                          </span>
                          {pct(o.wp)}
                        </>
                      ) : (
                        <span className="opt-prob">unavailable</span>
                      )}
                    </td>
                    <td>
                      <span className="opt-prob">
                        {o.underText || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
