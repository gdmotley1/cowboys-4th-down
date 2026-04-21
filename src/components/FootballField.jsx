import { useMemo, useState } from "react";

/**
 * Floating SVG field.  Playing area is TRANSPARENT — body background shows
 * through.  Only the Cowboys navy end-zone sidelines carry fill.  Yard lines,
 * numbers, star, corner insignia, and COWBOYS lettering are all layered on
 * the transparent turf, so the field reads as a premium graphic overlay
 * rather than a boxed dashboard widget.
 */

const VB_W = 1200;
const VB_H = 360;
const LEFT_EZ = 100;
const RIGHT_EZ_START = 1100;

function xFromYardline(yl) { return 100 + (100 - yl) * 10; }
function yFromDistance(d) {
  const c = Math.max(1, Math.min(22, d));
  return 320 - (c - 1) * (260 / 21);
}
function isoKey(p) { return `${p.game_id}::${p.play_id}`; }

function radiusFromStakes(gb) {
  const m = Math.abs(gb ?? 0);
  if (m >= 3) return 13;
  if (m >= 2) return 10.5;
  if (m >= 1) return 8;
  return 6;
}

function playVisible(play, filter) {
  if (filter === "misses") return play.correct === false;
  if (filter === "matched") return play.correct === true;
  return true;
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
  const transform = rotate180 ? `rotate(180 ${x} ${y - 8})` : undefined;
  const label = number === 50 ? "50" : side === "left" ? `◁ ${number}` : `${number} ▷`;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="rgba(255, 255, 255, 0.24)"
      fontFamily="Fraunces, serif"
      fontSize="20"
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

  const markers = useMemo(() => plays
    .filter((p) => playVisible(p, filter))
    .map((p) => {
      const bx = xFromYardline(p.yardline_100);
      const by = yFromDistance(p.ydstogo);
      const j = jitter(p.play_id);
      const isMiss = p.correct === false;
      const isNeutral = p.correct === null;
      const fill = isMiss ? "#ff8847" : isNeutral ? "#6b7485" : "#eaf0f6";
      const stroke = isMiss ? "#ffb380" : isNeutral ? "#8b94a4" : "#ffffff";
      const r = radiusFromStakes(p.go_boost);
      return {
        key: isoKey(p),
        p,
        cx: bx + j.dx, cy: by + j.dy, r,
        fill, stroke,
        alert: isMiss,
        dim: isNeutral,
        isSelected: p.play_id === selectedPlayId,
      };
    }), [plays, filter, selectedPlayId]);

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

  const CY_CENTER = VB_H / 2;

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
          <filter id="alertGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
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

        {/* Playing area — NO fill, transparent so body bg shows through */}

        {/* End zones — the only filled regions */}
        <rect x="0" y="0" width={LEFT_EZ} height={VB_H} fill="url(#ownEZ)" />
        <rect x={RIGHT_EZ_START} y="0" width={VB_W - RIGHT_EZ_START} height={VB_H} fill="url(#oppEZ)" />

        {/* COWBOYS vertical sidelines (both end zones) */}
        <text
          x={LEFT_EZ / 2} y={CY_CENTER}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.78)"
          fontFamily="Fraunces, serif"
          fontSize="32"
          fontWeight="700"
          letterSpacing="10"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0', dominantBaseline: "middle" }}
          transform={`rotate(-90 ${LEFT_EZ / 2} ${CY_CENTER})`}
        >
          COWBOYS
        </text>
        <text
          x={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} y={CY_CENTER}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.78)"
          fontFamily="Fraunces, serif"
          fontSize="32"
          fontWeight="700"
          letterSpacing="10"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0', dominantBaseline: "middle" }}
          transform={`rotate(90 ${RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} ${CY_CENTER})`}
        >
          COWBOYS
        </text>

        {/* Corner stars inside each end zone */}
        <CowboysStar cx={LEFT_EZ / 2} cy={28} r={16} fill="#c0c8d0" stroke="#001837" strokeWidth={1.5} opacity={0.95} />
        <CowboysStar cx={LEFT_EZ / 2} cy={VB_H - 28} r={16} fill="#c0c8d0" stroke="#001837" strokeWidth={1.5} opacity={0.95} />
        <CowboysStar cx={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} cy={28} r={16} fill="#c0c8d0" stroke="#001837" strokeWidth={1.5} opacity={0.95} />
        <CowboysStar cx={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} cy={VB_H - 28} r={16} fill="#c0c8d0" stroke="#001837" strokeWidth={1.5} opacity={0.95} />

        {/* Midfield watermark star */}
        <CowboysStar
          cx={600} cy={CY_CENTER}
          r={52}
          fill="#003594"
          stroke="#c0c8d0"
          strokeWidth={2.5}
          opacity={0.18}
        />

        {/* Goal lines (inner sideline borders) */}
        <line x1={LEFT_EZ} y1="0" x2={LEFT_EZ} y2={VB_H} stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
        <line x1={RIGHT_EZ_START} y1="0" x2={RIGHT_EZ_START} y2={VB_H} stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />

        {/* 5-yard dashed lines — very subtle on transparent */}
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
            <YardNumber x={d.x} y={42} number={d.n} side={d.side} rotate180={true} />
          </g>
        ))}
        {YL_DEF.map((d, i) => (
          <g key={`yln-bot-${i}`}>
            <YardNumber x={d.x} y={VB_H - 26} number={d.n} side={d.side} rotate180={false} />
          </g>
        ))}

        {/* Hash marks */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = LEFT_EZ + i * 10 + 10;
          return (
            <g key={`hm-${i}`}>
              <line x1={x} y1="116" x2={x} y2="124" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1={x} y1={VB_H - 124} x2={x} y2={VB_H - 116} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </g>
          );
        })}

        {/* Markers */}
        {markers
          .slice()
          .sort((a, b) => (Number(a.alert || a.isSelected)) - (Number(b.alert || b.isSelected)))
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
                <circle cx={m.cx} cy={m.cy} r={m.r + 7}
                  fill="none" stroke="#f5b041" strokeWidth="1.75" opacity="0.95" />
              )}
              <circle
                cx={m.cx} cy={m.cy} r={m.r}
                fill={m.fill} stroke={m.stroke} strokeWidth="1.25"
                opacity={m.dim ? 0.55 : 0.96}
              />
            </g>
          ))}

        {/* Hover tooltip */}
        {hover && (() => {
          const x = xFromYardline(hover.yardline_100);
          const y = yFromDistance(hover.ydstogo);
          const boxW = 250;
          const boxH = 60;
          const boxX = Math.min(VB_W - boxW - 6, Math.max(6, x + 14));
          const boxY = Math.min(VB_H - boxH - 6, Math.max(6, y - boxH - 10));
          const opp = TEAM_SHORT[hover.defteam] || hover.defteam;
          const fp = hover.yardline_100 < 50 ? `opp ${hover.yardline_100}`
            : hover.yardline_100 > 50 ? `own ${100 - hover.yardline_100}` : "midfield";
          const score = hover.score_differential === 0 ? "tied"
            : hover.score_differential > 0 ? `up ${hover.score_differential}` : `down ${-hover.score_differential}`;
          const isMiss = hover.correct === false;
          const accent = isMiss ? "#ff8847" : "#d0d6dc";
          return (
            <g pointerEvents="none">
              <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="8" ry="8"
                fill="rgba(6, 10, 22, 0.97)" stroke={accent} strokeWidth="1" />
              <text x={boxX + 13} y={boxY + 21}
                fill="#e6ebf2"
                fontFamily="Fraunces, serif" fontSize="13.5" fontWeight="500"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 40' }}>
                Week {hover.week} {hover.posteam === hover.home_team ? "vs" : "at"} {opp}
              </text>
              <text x={boxX + 13} y={boxY + 38}
                fill="#a8b0bf"
                fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="500">
                Q{hover.qtr} · 4th &amp; {hover.ydstogo} from {fp} · {score}
              </text>
              <text x={boxX + 13} y={boxY + 52}
                fill={accent}
                fontFamily="Manrope, sans-serif" fontSize="10.5" fontWeight="700"
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
