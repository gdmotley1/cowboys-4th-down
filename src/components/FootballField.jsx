import { useMemo, useState } from "react";

/**
 * Hand-drawn SVG field, oriented horizontally.
 *   Own end zone  ←  (left)                  (right)  →  Opponent end zone
 *
 * Coordinate mapping:
 *   viewBox = 0 0 1200 540
 *   x = 100 + (100 - yardline_100) * 10   (playing field 100..1100, end zones 0..100 and 1100..1200)
 *   y encodes distance-to-go (1 = bottom, 22 = top): y = 60 + (22 - ydstogo) * 20
 *
 * This keeps the familiar field metaphor while surfacing the second decision
 * axis (distance) vertically.  A small y-axis gauge outside the pitch labels it.
 */

const VB_W = 1200;
const VB_H = 540;
const LEFT_EZ = 100;
const RIGHT_EZ_START = 1100;

// Tick for each 10-yard line (x-coord, number label on the field)
const YARD_LINES = [10, 20, 30, 40, 50, 40, 30, 20, 10];

function xFromYardline(yl100) {
  return 100 + (100 - yl100) * 10;
}

function yFromDistance(ydstogo) {
  // 1 yard → y = 480 (bottom), 22 yards → y = 60 (top)
  const clamped = Math.max(1, Math.min(22, ydstogo));
  return 480 - (clamped - 1) * (420 / 21);
}

function isoPlayKey(p) { return `${p.game_id}::${p.play_id}`; }

function radiusFromStakes(goBoost) {
  const m = Math.abs(goBoost ?? 0);
  if (m >= 3) return 11;
  if (m >= 2) return 9;
  if (m >= 1) return 7.5;
  return 6;
}

function colorFor(play, filter) {
  if (play.correct === null) {
    return { fill: "#556069", stroke: "#7d8693", dim: true };
  }
  const isMiss = play.correct === false;
  const matchesFilter =
    filter === "all" ||
    (filter === "misses" && isMiss) ||
    (filter === "correct" && !isMiss);

  if (!matchesFilter) {
    return { fill: "#2e3542", stroke: "#3a414f", dim: true };
  }
  if (isMiss) {
    return { fill: "#ff9f0a", stroke: "#ffbe4a", dim: false, glow: true };
  }
  return { fill: "#d0d6dc", stroke: "#ffffff", dim: false };
}

function jitter(playId) {
  // Stable pseudo-random small offset so overlapping plays don't fully stack
  const s = String(playId);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  const a = (h & 0xff) / 255;
  const b = ((h >> 8) & 0xff) / 255;
  return {
    dx: (a - 0.5) * 7,
    dy: (b - 0.5) * 7,
  };
}

export default function FootballField({
  plays,
  filter,
  selectedPlayId,
  onSelect,
}) {
  const [hover, setHover] = useState(null);

  // Pre-compute marker positions + styles
  const markers = useMemo(() => {
    return plays.map((p) => {
      const baseX = xFromYardline(p.yardline_100);
      const baseY = yFromDistance(p.ydstogo);
      const j = jitter(p.play_id);
      const c = colorFor(p, filter);
      const r = radiusFromStakes(p.go_boost);
      const isSelected = p.play_id === selectedPlayId;
      return {
        key: isoPlayKey(p),
        p,
        cx: baseX + j.dx,
        cy: baseY + j.dy,
        r,
        ...c,
        isSelected,
      };
    });
  }, [plays, filter, selectedPlayId]);

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
            <stop offset="0%" stopColor="#0c1222" />
            <stop offset="100%" stopColor="#080d18" />
          </linearGradient>
          <linearGradient id="ownEZ" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#001c4d" />
            <stop offset="100%" stopColor="#003594" />
          </linearGradient>
          <linearGradient id="oppEZ" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#1a2030" />
            <stop offset="100%" stopColor="#0f1522" />
          </linearGradient>
          <filter id="alertGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="selectGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Turf */}
        <rect x={LEFT_EZ} y="0" width={RIGHT_EZ_START - LEFT_EZ} height={VB_H} fill="url(#turf)" />
        {/* End zones */}
        <rect x="0" y="0" width={LEFT_EZ} height={VB_H} fill="url(#ownEZ)" />
        <rect x={RIGHT_EZ_START} y="0" width={VB_W - RIGHT_EZ_START} height={VB_H} fill="url(#oppEZ)" />

        {/* End zone labels */}
        <text
          x={LEFT_EZ / 2} y={VB_H / 2 + 4}
          textAnchor="middle"
          fill="rgba(208, 214, 220, 0.6)"
          fontFamily="B612 Mono, monospace"
          fontSize="22"
          fontWeight="700"
          transform={`rotate(-90 ${LEFT_EZ / 2} ${VB_H / 2})`}
          letterSpacing="6"
        >
          DALLAS
        </text>
        <text
          x={RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} y={VB_H / 2 + 4}
          textAnchor="middle"
          fill="rgba(134, 147, 151, 0.45)"
          fontFamily="B612 Mono, monospace"
          fontSize="16"
          fontWeight="700"
          transform={`rotate(90 ${RIGHT_EZ_START + (VB_W - RIGHT_EZ_START) / 2} ${VB_H / 2})`}
          letterSpacing="6"
        >
          OPP EZ
        </text>

        {/* Yard lines — every 10 */}
        {YARD_LINES.map((ln, i) => {
          const x = LEFT_EZ + (i + 1) * 100;
          const isMid = ln === 50;
          return (
            <g key={`yl${i}`}>
              <line
                x1={x} y1="0" x2={x} y2={VB_H}
                stroke={isMid ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)"}
                strokeWidth={isMid ? 1.5 : 1}
              />
              {/* Yard numbers, top */}
              <text
                x={x - 14} y="48"
                fill="rgba(255,255,255,0.22)"
                fontFamily="B612 Mono, monospace"
                fontSize="28"
                fontWeight="700"
                letterSpacing="2"
              >
                {ln}
              </text>
              {/* Yard numbers, bottom (rotated 180) */}
              <text
                x={x + 14} y={VB_H - 28}
                fill="rgba(255,255,255,0.22)"
                fontFamily="B612 Mono, monospace"
                fontSize="28"
                fontWeight="700"
                letterSpacing="2"
                transform={`rotate(180 ${x} ${VB_H - 38})`}
              >
                {ln}
              </text>
            </g>
          );
        })}

        {/* 5-yard dashed lines */}
        {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((y, i) => {
          const x = LEFT_EZ + y * 10;
          return (
            <line
              key={`yl5-${i}`}
              x1={x} y1="0" x2={x} y2={VB_H}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
          );
        })}

        {/* Hash marks along top and bottom third */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = LEFT_EZ + i * 10 + 10;
          return (
            <g key={`hm-${i}`}>
              <line x1={x} y1="178" x2={x} y2="186" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <line x1={x} y1="354" x2={x} y2="362" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            </g>
          );
        })}

        {/* Goal lines — slightly brighter */}
        <line x1={LEFT_EZ} y1="0" x2={LEFT_EZ} y2={VB_H} stroke="rgba(255,255,255,0.42)" strokeWidth="2" />
        <line x1={RIGHT_EZ_START} y1="0" x2={RIGHT_EZ_START} y2={VB_H} stroke="rgba(255,255,255,0.42)" strokeWidth="2" />

        {/* Distance gauge on the left edge */}
        <g>
          <text
            x="4" y={VB_H / 2 + 4}
            fill="rgba(255, 159, 10, 0.45)"
            fontFamily="B612 Mono, monospace"
            fontSize="10"
            fontWeight="400"
            letterSpacing="3"
            transform={`rotate(-90 20 ${VB_H / 2})`}
            textAnchor="middle"
          >
            ↑ MORE DISTANCE
          </text>
        </g>

        {/* Markers — dim layer first, then bright layer on top (so alerts sit above) */}
        {markers
          .slice()
          .sort((a, b) => Number(a.glow || a.isSelected) - Number(b.glow || b.isSelected))
          .map((m) => (
            <g
              key={m.key}
              onMouseEnter={() => setHover(m.p)}
              onMouseLeave={() => setHover((h) => (h === m.p ? null : h))}
              onClick={() => onSelect && onSelect(m.p)}
              style={{ cursor: "pointer" }}
              filter={m.isSelected ? "url(#selectGlow)" : m.glow ? "url(#alertGlow)" : undefined}
            >
              {m.isSelected && (
                <circle cx={m.cx} cy={m.cy} r={m.r + 6} fill="none" stroke="#d4a443" strokeWidth="1.5" opacity="0.85" />
              )}
              <circle
                cx={m.cx}
                cy={m.cy}
                r={m.r}
                fill={m.fill}
                stroke={m.stroke}
                strokeWidth="1"
                opacity={m.dim ? 0.5 : 0.95}
              />
            </g>
          ))}

        {/* Hover tooltip (SVG foreignObject for simple HTML) */}
        {hover && (() => {
          const x = xFromYardline(hover.yardline_100);
          const y = yFromDistance(hover.ydstogo);
          const boxW = 220;
          const boxH = 64;
          const boxX = Math.min(VB_W - boxW - 8, Math.max(8, x + 16));
          const boxY = Math.min(VB_H - boxH - 8, Math.max(8, y - boxH - 14));
          const fp = hover.yardline_100 < 50
            ? `OPP ${hover.yardline_100}`
            : hover.yardline_100 > 50
              ? `OWN ${100 - hover.yardline_100}`
              : "MID 50";
          const score = hover.score_differential === 0
            ? "TIED"
            : hover.score_differential > 0
              ? `+${hover.score_differential}`
              : `${hover.score_differential}`;
          const gb = hover.go_boost;
          const gbTxt = gb != null ? `${gb >= 0 ? "+" : ""}${gb.toFixed(2)}` : "—";
          return (
            <g pointerEvents="none">
              <rect
                x={boxX} y={boxY}
                width={boxW} height={boxH}
                rx="1" ry="1"
                fill="rgba(4, 8, 18, 0.95)"
                stroke="rgba(255, 159, 10, 0.55)"
                strokeWidth="1"
              />
              <text x={boxX + 12} y={boxY + 18}
                fill="#d0d6dc"
                fontFamily="B612 Mono, monospace"
                fontSize="10"
                fontWeight="700"
                letterSpacing="2">
                WK·{String(hover.week).padStart(2, "0")}  ·  {hover.posteam === hover.home_team ? `vs ${hover.defteam}` : `@ ${hover.defteam}`}
              </text>
              <text x={boxX + 12} y={boxY + 36}
                fill="#8b94a4"
                fontFamily="B612 Mono, monospace"
                fontSize="9.5"
                letterSpacing="1.5">
                Q{hover.qtr}  DIST·{hover.ydstogo}  YL·{fp}  Δ·{score}
              </text>
              <text x={boxX + 12} y={boxY + 52}
                fill={gb != null && gb > 0 && hover.decision !== "went_for_it" ? "#ff9f0a" : "#d0d6dc"}
                fontFamily="B612 Mono, monospace"
                fontSize="9.5"
                fontWeight="700"
                letterSpacing="1.5">
                GO-BOOST {gbTxt} WP  ·  CLICK TO DRILL
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="field-legend">
        <span><span className="swatch alert" />Missed opportunity</span>
        <span><span className="swatch silver" />Matched model</span>
        <span><span className="swatch dim" />Not scored</span>
        <span style={{ marginLeft: "auto" }}>Marker size = stakes · Click any play →</span>
      </div>
    </div>
  );
}
