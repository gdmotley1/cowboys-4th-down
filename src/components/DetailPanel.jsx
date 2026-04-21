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

function fieldCoord(y) {
  if (y === 50) return "MID·50";
  if (y < 50) return `OPP·${y}`;
  return `OWN·${100 - y}`;
}

function deltaStr(d) {
  if (d === 0) return "Δ·TIED";
  if (d > 0) return `Δ·+${d}`;
  return `Δ·${d}`;
}

function timeStr(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.max(0, secs - m * 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function pct(v) {
  if (v == null || Number.isNaN(v)) return null;
  return `${(v * 100).toFixed(1)}%`;
}

const CHOICE = {
  went_for_it: "GO",
  punted: "PUNT",
  field_goal: "FIELD GOAL",
  other: "CLOCK KILL",
};

export default function DetailPanel({ play }) {
  if (!play) {
    return (
      <div className="panel detail-shell">
        <span className="corner-bl" />
        <span className="corner-br" />
        <div className="panel-head">
          <span className="panel-id">SEL·03 · PLAY BREAKDOWN</span>
          <span>AWAITING SELECTION</span>
        </div>
        <div className="detail-empty">
          <strong>SELECT A PLAY</strong>
          <br />
          ON THE FIELD OR IN THE GRID
          <br />
          <br />
          FULL WP BREAKDOWN APPEARS HERE
        </div>
      </div>
    );
  }

  const opp = TEAM_NAMES[play.defteam] || play.defteam;
  const matchup = play.posteam === play.home_team
    ? `${opp} at Cowboys`
    : `Cowboys at ${opp}`;

  const options = [
    {
      id: "go",
      name: "GO FOR IT",
      wp: play.go_wp,
      under: play.first_down_prob != null ? `${pct(play.first_down_prob)} FIRST-DOWN CHANCE` : null,
      chosen: play.decision === "went_for_it",
    },
    {
      id: "fg",
      name: "KICK FIELD GOAL",
      wp: play.fg_wp,
      under: play.fg_make_prob != null ? `${pct(play.fg_make_prob)} MAKE CHANCE` : null,
      chosen: play.decision === "field_goal",
    },
    {
      id: "punt",
      name: "PUNT",
      wp: play.punt_wp,
      under: null,
      chosen: play.decision === "punted",
    },
  ];

  const valid = options.map((o) => o.wp).filter((v) => v != null);
  const maxWP = valid.length ? Math.max(...valid) : null;
  const minWP = valid.length ? Math.min(...valid) : null;
  const span = maxWP != null && minWP != null ? Math.max(0.0001, maxWP - minWP) : 0;
  const modelChoice = options.find((o) => o.wp != null && o.wp === maxWP);
  const correctCall = modelChoice?.chosen;

  return (
    <div className="panel detail-shell">
      <span className="corner-bl" />
      <span className="corner-br" />
      <div className="panel-head">
        <span className="panel-id">SEL·03 · PLAY BREAKDOWN</span>
        <span className="mono">WK·{String(play.week).padStart(2, "0")} · PLAY·{play.play_id}</span>
      </div>

      <div className="detail-grid">
        {/* LEFT: situation + context */}
        <div className="detail-col">
          <div className="detail-coord">
            <span className="tag">Q<strong>{play.qtr}</strong></span>
            <span className="tag">T·<strong>{timeStr(play.game_seconds_remaining)}</strong></span>
            <span className="tag">DIST·<strong>{play.ydstogo}</strong></span>
            <span className="tag">YL·<strong>{fieldCoord(play.yardline_100)}</strong></span>
            <span className="tag">{deltaStr(play.score_differential)}</span>
          </div>

          <h3 className="detail-matchup">{matchup}</h3>
          <div className="detail-time mono">
            Week {play.week} regular season · game {play.game_id}
          </div>

          {play.desc && <div className="detail-desc">&ldquo;{play.desc}&rdquo;</div>}

          <div className="detail-verdict">
            <span className="chip navy">DAL · {CHOICE[play.decision]}</span>
            {modelChoice && (
              <span className="chip alert">MODEL · {modelChoice.name}</span>
            )}
            {play.correct != null && (
              <span className={`chip ${play.correct ? "ok" : "alert"}`}>
                {play.correct ? "ON MODEL" : "OFF MODEL"}
              </span>
            )}
            {play.go_boost != null && (
              <span className="chip">
                GO-BOOST · {play.go_boost >= 0 ? "+" : ""}{play.go_boost.toFixed(2)} WP
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: three-option WP comparison */}
        <div className="detail-col">
          <div className="options-kicker">
            {correctCall
              ? "WIN PROBABILITY · DALLAS CHOSE THE BEST OPTION"
              : "WIN PROBABILITY · MODEL-RECOMMENDED OPTION IN AMBER"}
          </div>

          <table className="options-table">
            <thead>
              <tr>
                <th>OPTION</th>
                <th>WIN PROBABILITY</th>
                <th>UNDERLYING</th>
              </tr>
            </thead>
            <tbody>
              {options.map((o) => {
                const isBest = o.wp != null && o.wp === maxWP;
                const width = o.wp != null
                  ? (span > 0 ? ((o.wp - minWP) / span) * 100 : 100)
                  : 0;
                return (
                  <tr key={o.id} className={isBest ? "is-best" : ""}>
                    <td className="opt-name">
                      {o.chosen && <span className="chosen-dot" />}
                      {o.name}
                    </td>
                    <td>
                      {o.wp != null ? (
                        <>
                          <span className="wp-bar">
                            <span style={{ width: `${Math.max(4, width)}%` }} />
                          </span>
                          {pct(o.wp)}
                        </>
                      ) : (
                        <span className="opt-prob">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className="opt-prob">{o.under || "—"}</span>
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
