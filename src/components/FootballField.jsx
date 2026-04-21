import { useMemo, useState } from "react";

/**
 * Floating, transparent-turf, proper-proportions football field.
 *   viewBox  = 1200 x 540  (≈ 2.22:1, close to the true 120:53.3 ratio)
 *   End zones = only filled regions (Cowboys navy)
 *   Playing area = transparent, page background shows through
 *
 * Markers:
 *   - Radial-gradient fill (amber for misses, silver for matched)
 *   - Subtle outer glow ring + drop shadow
 *   - Top-6 misses carry a ranked number inside the circle
 *   - Overlapping plays at the same (yardline, yards-to-go) get a tidy
 *     deterministic rosette layout instead of random jitter
 */

const VB_W = 1200;
const VB_H = 540;
const LEFT_EZ = 100;
const RIGHT_EZ_START = 1100;

function xFromYardline(yl) { return 100 + (100 - yl) * 10; }
function yFromDistance(d) {
  const c = Math.max(1, Math.min(22, d));
  return 485 - (c - 1) * (400 / 21);
}
function isoKey(p) { return `${p.game_id}::${p.play_id}`; }

function radiusFromStakes(gb) {
  const m = Math.abs(gb ?? 0);
  if (m >= 3)   return 14;
  if (m >= 2)   return 11;
  if (m >= 1)   return 9;
  return 7;
}

function playVisible(play, filter) {
  if (filter === "misses") return play.correct === false;
  if (filter === "matched") return play.correct === true;
  return true;
}

/** Deterministic rosette layout for plays that share the same bucket. */
function stackOffset(i, n, r) {
  if (n <= 1) return { dx: 0, dy: 0 };
  if (n === 2) {
    return i === 0 ? { dx: 0, dy: -r * 1.15 } : { dx: 0, dy: r * 1.15 };
  }
  if (n === 3) {
    return [
      { dx: 0, dy: -r * 1.25 },
      { dx: -r * 1.1, dy: r * 0.7 },
      { dx: r * 1.1, dy: r * 0.7 },
    ][i];
  }
  // Radial for 4+, starting at top
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
  const d = r * 1.35;
  return { dx: Math.cos(angle) * d, dy: Math.sin(angle) * d };
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

function CowboysStar({ cx, cy, r, fill = "#003594", stroke = "#c0c8d0", strokeWidth = 2, opacity = 1 }) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    points.push(`${Math.cos(angle) * rad},${Math.sin(angle) * rad}`);
  }
  return (
    <g transform={`translate(${cx}, ${cy})`} opacity={opacity}>
      <polygon
        points={points.join(" ")}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
}

function YardNumber({ x, y, number, side, rotate180 = false }) {
  const transform = rotate180 ? `rotate(180 ${x} ${y - 10})` : undefined;
  const label = number === 50 ? "50" : side === "left" ? `◁ ${number}` : `${number} ▷`;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="rgba(255, 255, 255, 0.24)"
      fontFamily="Fraunces, serif"
      fontSize="26"
      fontWeight="700"
      letterSpacing="1"
      style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0' }}
      transform={transform}
    >
      {label}
    </text>
  );
}

export default function FootballField({ plays, filter, selectedPlayId, onSelect }) {
  const [hover, setHover] = useState(null);

  // Rank ALL misses by |go_boost| so we can number the top 6 on the field.
  const rankById = useMemo(() => {
    const misses = plays
      .filter((p) => p.correct === false && p.go_boost != null)
      .slice()
      .sort((a, b) => Math.abs(b.go_boost) - Math.abs(a.go_boost));
    const map = {};
    misses.forEach((p, i) => { map[isoKey(p)] = i + 1; });
    return map;
  }, [plays]);

  // Group visible plays by (yardline_100, ydstogo) bucket; biggest stakes
  // render on top (last → above) so numbered markers are never hidden.
  const markers = useMemo(() => {
    const visible = plays.filter((p) => playVisible(p, filter));
    const buckets = {};
    for (const p of visible) {
      const k = `${p.yardline_100}:${p.ydstogo}`;
      (buckets[k] ||= []).push(p);
    }
    for (const k of Object.keys(buckets)) {
      buckets[k].sort(
        (a, b) => Math.abs(b.go_boost ?? 0) - Math.abs(a.go_boost ?? 0)
      );
    }
    const out = [];
    for (const [k, list] of Object.entries(buckets)) {
      const [yl, dist] = k.split(":").map(Number);
      const bx = xFromYardline(yl);
      const by = yFromDistance(dist);
      list.forEach((p, i) => {
        const r = radiusFromStakes(p.go_boost);
        const o = stackOffset(i, list.length, r);
        const isMiss = p.correct === false;
        const isNeutral = p.correct === null;
        out.push({
          key: isoKey(p),
          p,
          cx: bx + o.dx,
          cy: by + o.dy,
          r,
          alert: isMiss,
          dim: isNeutral,
          isSelected: p.play_id === selectedPlayId,
          rank: isMiss ? rankById[isoKey(p)] : null,
        });
      });
    }
    return out;
  }, [plays, filter, selectedPlayId, rankById]);

  const YL_DEF = [
    { x: 200, n: 10, side: "left" },
    { x: 300, n: 20, side: "left" },
    { x: 400, n: 30, side: "left" },
    { x: 500, n: 40, side: "left" },
    { x: 600, n: 50, side: "mid" },
    { x: 700, n: 40, side: "right" },
    { x: 800, n: 30, side: "right" },
    { x: 900, n: 20, side: "right" },
    { x: 1000, n: 10, side: "right" },
  ];

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
          <linearGradient id="ownEZ" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"  stopColor="#001837" />
            <stop offset="100%" stopColor="#003594" />
          </linearGradient>
          <linearGradient id="oppEZ" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#003594" />
            <stop offset="100%" stopColor="#001837" />
          </linearGradient>
          {/* Marker gradients */}
          <radialGradient id="missGrad" cx="32%" cy="28%" r="78%">
            <stop offset="0%"   stopColor="#ffd3aa" />
            <stop offset="45%"  stopColor="#ff8847" />
            <stop offset="100%" stopColor="#b0531f" />
          </radialGradient>
          <radialGradient id="silverGrad" cx="32%" cy="28%" r="80%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="60%"  stopColor="#c0c8d0" />
            <stop offset="100%" stopColor="#6b7485" />
          </radialGradient>
          <radialGradient id="dimGrad" cx="32%" cy="28%" r="80%">
            <stop offset="0%"   stopColor="#8b94a4" />
            <stop offset="100%" stopColor="#3a414f" />
          </radialGradient>
          <filter id="markerShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.55" />
          </filter>
          <filter id="selectGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* End zones */}
        <rect x="0" y="0" width={LEFT_EZ} height={VB_H} fill="url(#ownEZ)" />
        <rect x={RIGHT_EZ_START} y="0" width={VB_W - RIGHT_EZ_START} height={VB_H} fill="url(#oppEZ)" />

        {/* COWBOYS vertical sidelines */}
        <text
          x={LEFT_EZ / 2} y={VB_H / 2}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.78)"
          fontFamily="Fraunces, serif"
          fontSize="44"
          fontWeight="700"
          letterSpacing="14"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0', dominantBaseline: "middle" }}
          transform={`rotate(-90 ${LEFT_EZ / 2} ${VB_H / 2})`}
        >
          COWBOYS
        </text>
        <text
          x={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} y={VB_H / 2}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.78)"
          fontFamily="Fraunces, serif"
          fontSize="44"
          fontWeight="700"
          letterSpacing="14"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0', dominantBaseline: "middle" }}
          transform={`rotate(90 ${RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} ${VB_H / 2})`}
        >
          COWBOYS
        </text>

        {/* Corner stars */}
        <CowboysStar cx={LEFT_EZ / 2} cy={42} r={22} fill="#c0c8d0" stroke="#001837" strokeWidth={2} opacity={0.95} />
        <CowboysStar cx={LEFT_EZ / 2} cy={VB_H - 42} r={22} fill="#c0c8d0" stroke="#001837" strokeWidth={2} opacity={0.95} />
        <CowboysStar cx={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} cy={42} r={22} fill="#c0c8d0" stroke="#001837" strokeWidth={2} opacity={0.95} />
        <CowboysStar cx={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} cy={VB_H - 42} r={22} fill="#c0c8d0" stroke="#001837" strokeWidth={2} opacity={0.95} />

        {/* Midfield star */}
        <CowboysStar
          cx={600} cy={VB_H / 2}
          r={68}
          fill="#003594"
          stroke="#c0c8d0"
          strokeWidth={3}
          opacity={0.17}
        />

        {/* Goal lines */}
        <line x1={LEFT_EZ} y1="0" x2={LEFT_EZ} y2={VB_H} stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
        <line x1={RIGHT_EZ_START} y1="0" x2={RIGHT_EZ_START} y2={VB_H} stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />

        {/* 5-yard dashes */}
        {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((y, i) => {
          const x = LEFT_EZ + y * 10;
          return (
            <line key={`yl5-${i}`} x1={x} y1="0" x2={x} y2={VB_H}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 7" />
          );
        })}

        {/* 10-yard lines */}
        {YL_DEF.map((d, i) => {
          const isMid = d.n === 50;
          return (
            <line
              key={`yl10-${i}`}
              x1={d.x} y1="0" x2={d.x} y2={VB_H}
              stroke={isMid ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.13)"}
              strokeWidth={isMid ? 1.5 : 1}
            />
          );
        })}

        {/* Yard numbers */}
        {YL_DEF.map((d, i) => (
          <g key={`yln-top-${i}`}>
            <YardNumber x={d.x} y={58} number={d.n} side={d.side} rotate180={true} />
          </g>
        ))}
        {YL_DEF.map((d, i) => (
          <g key={`yln-bot-${i}`}>
            <YardNumber x={d.x} y={VB_H - 34} number={d.n} side={d.side} rotate180={false} />
          </g>
        ))}

        {/* Hash marks */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = LEFT_EZ + i * 10 + 10;
          return (
            <g key={`hm-${i}`}>
              <line x1={x} y1="178" x2={x} y2="186" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
              <line x1={x} y1={VB_H - 186} x2={x} y2={VB_H - 178} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            </g>
          );
        })}

        {/* Markers — premium treatment */}
        {markers
          .slice()
          .sort((a, b) => {
            // Selected on top, then ranked misses, then unranked misses, then matched
            const aScore = (a.isSelected ? 1000 : 0) + (a.rank ? (200 - a.rank) : 0) + (a.alert ? 10 : 0);
            const bScore = (b.isSelected ? 1000 : 0) + (b.rank ? (200 - b.rank) : 0) + (b.alert ? 10 : 0);
            return aScore - bScore;
          })
          .map((m) => {
            const gradId = m.alert ? "missGrad" : m.dim ? "dimGrad" : "silverGrad";
            const stroke = m.alert ? "#ffcfa6" : m.dim ? "#5b6472" : "#ffffff";
            const showRank = m.alert && m.rank != null && m.rank <= 6;
            return (
              <g
                key={m.key}
                onMouseEnter={() => setHover(m.p)}
                onMouseLeave={() => setHover((h) => (h === m.p ? null : h))}
                onClick={() => onSelect && onSelect(m.p)}
                style={{ cursor: "pointer" }}
              >
                {/* Soft outer ring — adds halo + lift */}
                {m.alert && !m.dim && (
                  <circle
                    cx={m.cx} cy={m.cy} r={m.r + 2.5}
                    fill="none"
                    stroke="rgba(255, 136, 71, 0.22)"
                    strokeWidth="1"
                  />
                )}

                {/* Selection ring in Cowboys gold — glow applied only here */}
                {m.isSelected && (
                  <circle
                    cx={m.cx} cy={m.cy} r={m.r + 8}
                    fill="none"
                    stroke="#f5b041"
                    strokeWidth="2"
                    opacity="0.95"
                    filter="url(#selectGlow)"
                  />
                )}

                {/* Main marker */}
                <circle
                  cx={m.cx} cy={m.cy} r={m.r}
                  fill={`url(#${gradId})`}
                  stroke={stroke}
                  strokeWidth="1.25"
                  opacity={m.dim ? 0.7 : 1}
                  filter="url(#markerShadow)"
                />

                {/* Rank number for top 6 misses */}
                {showRank && (
                  <text
                    x={m.cx}
                    y={m.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#2a1204"
                    fontSize={Math.max(10, m.r * 0.95)}
                    fontWeight="800"
                    fontFamily="Manrope, sans-serif"
                    style={{ pointerEvents: "none", letterSpacing: "-0.02em" }}
                  >
                    {m.rank}
                  </text>
                )}
              </g>
            );
          })}

        {/* Hover tooltip */}
        {hover && (() => {
          const x = xFromYardline(hover.yardline_100);
          const y = yFromDistance(hover.ydstogo);
          const boxW = 260;
          const boxH = 62;
          const boxX = Math.min(VB_W - boxW - 8, Math.max(8, x + 16));
          const boxY = Math.min(VB_H - boxH - 8, Math.max(8, y - boxH - 14));
          const opp = TEAM_SHORT[hover.defteam] || hover.defteam;
          const fp = hover.yardline_100 < 50 ? `opp ${hover.yardline_100}`
            : hover.yardline_100 > 50 ? `own ${100 - hover.yardline_100}` : "midfield";
          const score = hover.score_differential === 0 ? "tied"
            : hover.score_differential > 0 ? `up ${hover.score_differential}` : `down ${-hover.score_differential}`;
          const isMiss = hover.correct === false;
          const accent = isMiss ? "#ff8847" : "#d0d6dc";
          const rank = isMiss ? rankById[isoKey(hover)] : null;
          return (
            <g pointerEvents="none">
              <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="8" ry="8"
                fill="rgba(6, 10, 22, 0.97)" stroke={accent} strokeWidth="1" />
              <text x={boxX + 14} y={boxY + 22}
                fill="#e6ebf2"
                fontFamily="Fraunces, serif" fontSize="14" fontWeight="500"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 40' }}>
                {rank != null && <tspan fill={accent} fontWeight="700">#{rank}&nbsp;·&nbsp;</tspan>}
                Week {hover.week} {hover.posteam === hover.home_team ? "vs" : "at"} {opp}
              </text>
              <text x={boxX + 14} y={boxY + 40}
                fill="#a8b0bf"
                fontFamily="Manrope, sans-serif" fontSize="11.5" fontWeight="500">
                Q{hover.qtr} · 4th &amp; {hover.ydstogo} from {fp} · {score}
              </text>
              <text x={boxX + 14} y={boxY + 54}
                fill={accent}
                fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700"
                letterSpacing="0.04em">
                {hover.go_boost != null
                  ? `${hover.go_boost >= 0 ? "+" : ""}${hover.go_boost.toFixed(2)} WP · click to drill`
                  : "unscored — click to view"}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
