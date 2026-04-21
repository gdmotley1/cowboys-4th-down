import { useMemo, useState } from "react";

const VB_W = 1200;
const VB_H = 540;
const LEFT_EZ = 100;
const RIGHT_EZ_START = 1100;
const YARD_LINES = [10, 20, 30, 40, 50, 40, 30, 20, 10];

function xFromYardline(yl) { return 100 + (100 - yl) * 10; }
function yFromDistance(d) {
  const c = Math.max(1, Math.min(22, d));
  return 480 - (c - 1) * (420 / 21);
}
function isoKey(p) { return `${p.game_id}::${p.play_id}`; }

function radiusFromStakes(gb) {
  const m = Math.abs(gb ?? 0);
  if (m >= 3) return 10.5;
  if (m >= 2) return 8.5;
  if (m >= 1) return 7;
  return 5.5;
}

function colorFor(play, filter) {
  if (play.correct === null) return { fill: "#556069", stroke: "#6b7485", dim: true };
  const isMiss = play.correct === false;
  const matches = filter === "all" ||
    (filter === "misses" && isMiss) ||
    (filter === "correct" && !isMiss);
  if (!matches) return { fill: "#2c3344", stroke: "#404758", dim: true };
  if (isMiss) return { fill: "#ff8847", stroke: "#ffb380", alert: true };
  return { fill: "#d0d6dc", stroke: "#ffffff" };
}

function jitter(playId) {
  const s = String(playId);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return { dx: (((h & 0xff) / 255) - 0.5) * 6, dy: (((h >> 8) & 0xff) / 255 - 0.5) * 6 };
}

const TEAM_SHORT = {
  ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills",
  CAR: "Panthers", CHI: "Bears", CIN: "Bengals", CLE: "Browns",
  DAL: "Cowboys", DEN: "Broncos", DET: "Lions", GB: "Packers",
  HOU: "Texans", IND: "Colts", JAX: "Jaguars", KC: "Chiefs",
  LA: "Rams", LAC: "Chargers", LV: "Raiders", MIA: "Dolphins",
  MIN: "Vikings", NE: "Patriots", NO: "Saints", NYG: "Giants",
  NYJ: "Jets", PHI: "Eagles", PIT: "Steelers", SEA: "Seahawks",
  SF: "49ers", TB: "Buccaneers", TEN: "Titans", WAS: "Commanders",
};

export default function FootballField({ plays, filter, selectedPlayId, onSelect }) {
  const [hover, setHover] = useState(null);

  const markers = useMemo(() => plays.map((p) => {
    const bx = xFromYardline(p.yardline_100);
    const by = yFromDistance(p.ydstogo);
    const j = jitter(p.play_id);
    const c = colorFor(p, filter);
    const r = radiusFromStakes(p.go_boost);
    return {
      key: isoKey(p), p,
      cx: bx + j.dx, cy: by + j.dy, r,
      ...c,
      isSelected: p.play_id === selectedPlayId,
    };
  }), [plays, filter, selectedPlayId]);

  return (
    <div className="field-wrap">
      <svg
        className="field-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Cowboys 2025 fourth-down decisions plotted on a football field"
      >
        <defs>
          <linearGradient id="turf" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0d1426" />
            <stop offset="50%" stopColor="#0a1120" />
            <stop offset="100%" stopColor="#080e1c" />
          </linearGradient>
          <linearGradient id="ownEZ" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#001437" />
            <stop offset="100%" stopColor="#003594" />
          </linearGradient>
          <linearGradient id="oppEZ" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#1a1f2e" />
            <stop offset="100%" stopColor="#121726" />
          </linearGradient>
          <filter id="alertGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="selectGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Turf */}
        <rect x={LEFT_EZ} y="0" width={RIGHT_EZ_START - LEFT_EZ} height={VB_H} fill="url(#turf)" />
        <rect x="0" y="0" width={LEFT_EZ} height={VB_H} fill="url(#ownEZ)" />
        <rect x={RIGHT_EZ_START} y="0" width={VB_W - RIGHT_EZ_START} height={VB_H} fill="url(#oppEZ)" />

        {/* End-zone labels — quiet, just team abbreviations */}
        <text
          x={LEFT_EZ / 2} y={VB_H / 2 + 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontFamily="Fraunces, serif"
          fontSize="20"
          fontWeight="500"
          transform={`rotate(-90 ${LEFT_EZ / 2} ${VB_H / 2})`}
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
          letterSpacing="4"
        >
          DAL
        </text>
        <text
          x={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} y={VB_H / 2 + 4}
          textAnchor="middle"
          fill="rgba(168,176,191,0.4)"
          fontFamily="Fraunces, serif"
          fontSize="14"
          fontWeight="500"
          transform={`rotate(90 ${RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} ${VB_H / 2})`}
          letterSpacing="3"
        >
          OPP
        </text>

        {/* 5-yard lines (dashed, quiet) */}
        {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((y, i) => {
          const x = LEFT_EZ + y * 10;
          return (
            <line key={`yl5-${i}`} x1={x} y1="0" x2={x} y2={VB_H}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 6" />
          );
        })}

        {/* 10-yard lines + painted numbers */}
        {YARD_LINES.map((ln, i) => {
          const x = LEFT_EZ + (i + 1) * 100;
          const isMid = ln === 50;
          return (
            <g key={`yl${i}`}>
              <line
                x1={x} y1="0" x2={x} y2={VB_H}
                stroke={isMid ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"}
                strokeWidth={isMid ? 1.5 : 1}
              />
              <text
                x={x} y="52" textAnchor="middle"
                fill="rgba(255,255,255,0.18)"
                fontFamily="Fraunces, serif"
                fontSize="26"
                fontWeight="500"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                letterSpacing="1"
              >
                {ln}
              </text>
              <text
                x={x} y={VB_H - 30} textAnchor="middle"
                fill="rgba(255,255,255,0.18)"
                fontFamily="Fraunces, serif"
                fontSize="26"
                fontWeight="500"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                letterSpacing="1"
                transform={`rotate(180 ${x} ${VB_H - 40})`}
              >
                {ln}
              </text>
            </g>
          );
        })}

        {/* Hash marks */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = LEFT_EZ + i * 10 + 10;
          return (
            <g key={`hm-${i}`}>
              <line x1={x} y1="180" x2={x} y2="188" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1={x} y1="352" x2={x} y2="360" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </g>
          );
        })}

        {/* Goal lines */}
        <line x1={LEFT_EZ} y1="0" x2={LEFT_EZ} y2={VB_H} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <line x1={RIGHT_EZ_START} y1="0" x2={RIGHT_EZ_START} y2={VB_H} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

        {/* Markers — alerts/selected drawn on top */}
        {markers
          .slice()
          .sort((a, b) =>
            (Number(a.alert || a.isSelected)) - (Number(b.alert || b.isSelected))
          )
          .map((m) => (
            <g
              key={m.key}
              onMouseEnter={() => setHover(m.p)}
              onMouseLeave={() => setHover((h) => (h === m.p ? null : h))}
              onClick={() => onSelect && onSelect(m.p)}
              style={{ cursor: "pointer" }}
              filter={m.isSelected ? "url(#selectGlow)" : m.alert ? "url(#alertGlow)" : undefined}
            >
              {m.isSelected && (
                <circle cx={m.cx} cy={m.cy} r={m.r + 6}
                  fill="none"
                  stroke="#f5b041"
                  strokeWidth="1.5"
                  opacity="0.9" />
              )}
              <circle
                cx={m.cx}
                cy={m.cy}
                r={m.r}
                fill={m.fill}
                stroke={m.stroke}
                strokeWidth="1"
                opacity={m.dim ? 0.45 : 0.95}
              />
            </g>
          ))}

        {/* Hover tooltip — softer than the tactical version */}
        {hover && (() => {
          const x = xFromYardline(hover.yardline_100);
          const y = yFromDistance(hover.ydstogo);
          const boxW = 240;
          const boxH = 62;
          const boxX = Math.min(VB_W - boxW - 8, Math.max(8, x + 14));
          const boxY = Math.min(VB_H - boxH - 8, Math.max(8, y - boxH - 12));
          const opp = TEAM_SHORT[hover.defteam] || hover.defteam;
          const fp = hover.yardline_100 < 50
            ? `opp ${hover.yardline_100}`
            : hover.yardline_100 > 50
              ? `own ${100 - hover.yardline_100}`
              : "midfield";
          const score = hover.score_differential === 0
            ? "tied"
            : hover.score_differential > 0 ? `up ${hover.score_differential}` : `down ${-hover.score_differential}`;
          const isMiss = hover.correct === false;
          const accent = isMiss ? "#ff8847" : "#d0d6dc";
          return (
            <g pointerEvents="none">
              <rect
                x={boxX} y={boxY} width={boxW} height={boxH}
                rx="8" ry="8"
                fill="rgba(10, 14, 26, 0.96)"
                stroke={accent}
                strokeWidth="1"
                opacity="0.98"
              />
              <text x={boxX + 14} y={boxY + 22}
                fill="#e6ebf2"
                fontFamily="Fraunces, serif"
                fontSize="14"
                fontWeight="500"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 40' }}>
                Week {hover.week} {hover.posteam === hover.home_team ? "vs" : "at"} {opp}
              </text>
              <text x={boxX + 14} y={boxY + 39}
                fill="#a8b0bf"
                fontFamily="Manrope, sans-serif"
                fontSize="11.5"
                fontWeight="500">
                Q{hover.qtr} · 4th &amp; {hover.ydstogo} from {fp} · {score}
              </text>
              <text x={boxX + 14} y={boxY + 54}
                fill={accent}
                fontFamily="Manrope, sans-serif"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.05em">
                {hover.go_boost != null
                  ? `${hover.go_boost >= 0 ? "+" : ""}${hover.go_boost.toFixed(2)} WP · click to drill`
                  : "unscored — click to view"}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="field-legend">
        <span className="lg-item"><span className="lg-dot alert" />Missed opportunity</span>
        <span className="lg-item"><span className="lg-dot silver" />Matched model</span>
        <span className="lg-item"><span className="lg-dot dim" />Unscored</span>
        <span className="spacer" />
        <span className="lg-item" style={{ color: "var(--text-3)" }}>
          Marker size = stakes · Hover for detail, click to drill
        </span>
      </div>
    </div>
  );
}
