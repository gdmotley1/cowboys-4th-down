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

const CHOICE_LABEL = {
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
  if (y < 50) return `the opponent's ${y}-yard line`;
  return `the Cowboys' ${100 - y}-yard line`;
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
  const ranked = useMemo(() => {
    return plays
      .filter((p) => p.correct === false && p.go_boost != null)
      .slice()
      .sort((a, b) => Math.abs(b.go_boost) - Math.abs(a.go_boost));
  }, [plays]);

  return (
    <div className="detail-empty">
      <div className="lead">
        <strong>Every 2025 missed opportunity, ranked.</strong> Click any play
        (here or on the field) to see the full three-option win-probability
        breakdown.
      </div>
      <ul className="miss-list">
        {ranked.map((p, i) => {
          const opp = TEAM_NAMES[p.defteam] || p.defteam;
          const loc = p.posteam === p.home_team ? "vs" : "at";
          return (
            <li key={`${p.game_id}-${p.play_id}`}>
              <button
                className="miss-row"
                onClick={() => onSelect(p)}
                type="button"
              >
                <span className="rank num">{String(i + 1).padStart(2, "0")}</span>
                <span className="info">
                  <span className="where">Wk {p.week} {loc} {opp}</span>
                  <span className="sit">
                    Q{p.qtr} · 4th &amp; {p.ydstogo} · {fieldPos(p.yardline_100)} · {CHOICE_LABEL[p.decision]}
                  </span>
                </span>
                <span className="cost num">+{p.go_boost.toFixed(2)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SelectedPlay({ play }) {
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
    <div className="detail-sel">
      <div className="detail-ctx">
        <span className="wk">Week {play.week}</span>
        <span className="vs">
          {play.posteam === play.home_team ? "vs " : "at "}{opp}
        </span>
      </div>
      <h3 className="detail-matchup">{matchup}</h3>

      <div className="detail-snap">
        <div className="cell">
          <div className="k">Situation</div>
          <div className="v num">4th &amp; {play.ydstogo}</div>
        </div>
        <div className="cell">
          <div className="k">Ball on</div>
          <div className="v">{fieldPosFull(play.yardline_100)}</div>
        </div>
        <div className="cell">
          <div className="k">Game state</div>
          <div className="v">Q{play.qtr} · {timeStr(play.game_seconds_remaining)}</div>
        </div>
        <div className="cell">
          <div className="k">Score</div>
          <div className="v">
            Dallas {scoreTxt(play.score_differential)}
          </div>
        </div>
      </div>

      {play.desc && <p className="detail-desc">{play.desc}</p>}

      <div className="verdict">
        <span className="chip navy">
          <span className="k">Dallas</span> {CHOICE_LABEL[play.decision]}
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
        {play.go_boost != null && (
          <span className="chip dim">
            <span className="k">Go boost</span>
            <span className="num">
              {play.go_boost >= 0 ? "+" : ""}{play.go_boost.toFixed(2)} WP
            </span>
          </span>
        )}
      </div>

      <p className="options-kicker">
        {correctCall
          ? "Win probability by option — Dallas chose the best"
          : "Win probability by option — model's pick in amber"}
      </p>

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
  );
}

export default function DetailPanel({ play, allPlays, onSelect }) {
  return (
    <div className="panel detail-panel">
      <div className="panel-head">
        <h3>{play ? "Play breakdown" : "Missed opportunities"}</h3>
        <span className="muted">
          {play ? `Play ${play.play_id}` : `${allPlays.filter(p => p.correct === false).length} ranked by WP cost`}
        </span>
      </div>
      {play
        ? <SelectedPlay play={play} />
        : <EmptyState plays={allPlays} onSelect={onSelect} />}
    </div>
  );
}
