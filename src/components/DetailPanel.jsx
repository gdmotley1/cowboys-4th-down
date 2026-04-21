import { useMemo } from "react";

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
  went_for_it: "Went for it",
  punted: "Punted",
  field_goal: "Kicked FG",
  other: "Ran clock",
};

function fieldPos(y) {
  if (y === 50) return "midfield";
  if (y < 50) return `opp ${y}`;
  return `own ${100 - y}`;
}
function fieldPosFull(y) {
  if (y === 50) return "midfield";
  if (y < 50) return `opponent's ${y}-yard line`;
  return `own ${100 - y}-yard line`;
}
function scoreTxt(d) {
  if (d === 0) return "tied";
  if (d > 0) return `leading by ${d}`;
  return `trailing by ${-d}`;
}
function timeStr(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.max(0, secs - m * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function pct(v) {
  if (v == null || Number.isNaN(v)) return null;
  return `${(v * 100).toFixed(1)}%`;
}

function EmptyState({ plays, onSelect }) {
  const top = useMemo(() => {
    return plays
      .filter((p) => p.correct === false && p.go_boost != null)
      .slice()
      .sort((a, b) => Math.abs(b.go_boost) - Math.abs(a.go_boost))
      .slice(0, 4);
  }, [plays]);

  return (
    <div className="dp-empty">
      <div className="dp-empty-head">
        <div>
          <div className="dp-kicker">The worst calls of the season</div>
          <p className="dp-empty-sub">
            Click any miss on the field above, or one of the top four below,
            for the full three-option win-probability breakdown.
          </p>
        </div>
      </div>
      <div className="dp-top-grid">
        {top.map((p, i) => {
          const opp = TEAM_NAMES[p.defteam] || p.defteam;
          const loc = p.posteam === p.home_team ? "vs" : "at";
          return (
            <button
              key={`${p.game_id}-${p.play_id}`}
              className="dp-top-card"
              onClick={() => onSelect(p)}
              type="button"
            >
              <div className="dp-top-head">
                <span className="dp-top-rank num">No. {i + 1}</span>
                <span className="dp-top-cost num">
                  +{p.go_boost.toFixed(2)} <span className="unit">WP</span>
                </span>
              </div>
              <div className="dp-top-matchup">
                Week {p.week} {loc} {opp}
              </div>
              <div className="dp-top-sit">
                Q{p.qtr} · 4th &amp; {p.ydstogo} · {fieldPos(p.yardline_100)} ·{" "}
                {scoreTxt(p.score_differential)}
              </div>
              <div className="dp-top-verdict">
                Dallas {CHOICE[p.decision].toLowerCase()} · model said go
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectedPlay({ play, onClose }) {
  const opp = TEAM_NAMES[play.defteam] || play.defteam;
  const matchup = play.posteam === play.home_team
    ? `${opp} at Cowboys`
    : `Cowboys at ${opp}`;

  const options = [
    {
      id: "go",
      name: "Go for it",
      wp: play.go_wp,
      under: play.first_down_prob != null ? `${pct(play.first_down_prob)} convert` : null,
      chosen: play.decision === "went_for_it",
    },
    {
      id: "fg",
      name: "Kick FG",
      wp: play.fg_wp,
      under: play.fg_make_prob != null ? `${pct(play.fg_make_prob)} make` : null,
      chosen: play.decision === "field_goal",
    },
    {
      id: "punt",
      name: "Punt",
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
    <div className="dp-selected">
      <div className="dp-sel-top">
        <div>
          <div className="dp-kicker">Play breakdown</div>
          <h3 className="dp-matchup">{matchup}</h3>
          <div className="dp-sub">
            Week {play.week} · Q{play.qtr} · {timeStr(play.game_seconds_remaining)} remaining
          </div>
        </div>
        <button className="dp-close" onClick={onClose} type="button" aria-label="Deselect play">
          ✕
        </button>
      </div>

      <div className="dp-body">
        <div className="dp-context">
          <div className="dp-snap">
            <div className="dp-cell">
              <span className="k">Situation</span>
              <span className="v num">4th &amp; {play.ydstogo}</span>
            </div>
            <div className="dp-cell">
              <span className="k">Ball on</span>
              <span className="v">{fieldPosFull(play.yardline_100)}</span>
            </div>
            <div className="dp-cell">
              <span className="k">Score</span>
              <span className="v">Dallas {scoreTxt(play.score_differential)}</span>
            </div>
            <div className="dp-cell">
              <span className="k">Go-boost</span>
              <span className="v num">
                {play.go_boost != null
                  ? `${play.go_boost >= 0 ? "+" : ""}${play.go_boost.toFixed(2)} WP`
                  : "—"}
              </span>
            </div>
          </div>

          {play.desc && <p className="dp-desc">{play.desc}</p>}

          <div className="dp-verdict">
            <span className="chip navy">
              <span className="k">Dallas</span> {CHOICE[play.decision]}
            </span>
            {modelChoice && (
              <span className="chip alert">
                <span className="k">Model</span> {modelChoice.name}
              </span>
            )}
            {play.correct === true && (
              <span className="chip good">
                <span className="k">Verdict</span> On model
              </span>
            )}
            {play.correct === false && (
              <span className="chip alert">
                <span className="k">Verdict</span> Missed opportunity
              </span>
            )}
          </div>
        </div>

        <div className="dp-options">
          <div className="dp-kicker">
            {correctCall
              ? "Win probability by option — Dallas took the best"
              : "Win probability by option — model's pick in amber"}
          </div>
          <div className="options-list">
            {options.map((o) => {
              const isBest = o.wp != null && o.wp === maxWP;
              const width = o.wp != null
                ? (span > 0 ? ((o.wp - minWP) / span) * 100 : 100)
                : 0;
              return (
                <div
                  key={o.id}
                  className={
                    "opt-row" +
                    (isBest ? " is-best" : "") +
                    (o.chosen ? " is-chosen" : "")
                  }
                >
                  <div className="opt-head">
                    <span className="opt-name">
                      {o.chosen && <span className="opt-marker" />}
                      {o.name}
                    </span>
                    <span className="opt-under">
                      {o.under || (o.wp != null ? "—" : "\u00a0")}
                    </span>
                  </div>
                  <div className="opt-bar">
                    {o.wp != null && <span style={{ width: `${Math.max(5, width)}%` }} />}
                  </div>
                  <div className={`opt-wp serif num${o.wp == null ? " na" : ""}`}>
                    {o.wp != null ? pct(o.wp) : "n/a"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailPanel({ play, allPlays, onSelect }) {
  return (
    <section className="panel dp-shell">
      {play
        ? <SelectedPlay play={play} onClose={() => onSelect(null)} />
        : <EmptyState plays={allPlays} onSelect={onSelect} />}
    </section>
  );
}
