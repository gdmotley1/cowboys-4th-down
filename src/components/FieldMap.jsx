import { useMemo, useRef } from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, annotationPlugin);

const COLOR_CORRECT = "#22c55e";
const COLOR_INCORRECT = "#ef4444";
const COLOR_NEUTRAL = "#6b7280";
const COLOR_SELECTED_RING = "#d4a443";

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

function fieldPosition(yl100) {
  if (yl100 === 50) return "midfield";
  if (yl100 < 50) return `opp ${yl100}`;
  return `own ${100 - yl100}`;
}

function scoreText(diff) {
  if (diff === 0) return "tied";
  if (diff > 0) return `up ${diff}`;
  return `down ${-diff}`;
}

function actionText(decision) {
  return {
    went_for_it: "went for it",
    punted: "punted",
    field_goal: "kicked FG",
    other: "ran clock",
  }[decision];
}

function decisionShape(decision) {
  return {
    went_for_it: "circle",
    punted: "rectRot", // diamond
    field_goal: "triangle",
    other: "rect",
  }[decision] || "circle";
}

function pointRadius(goBoost) {
  const mag = Math.abs(goBoost ?? 0);
  if (mag >= 3) return 11;
  if (mag >= 2) return 9;
  if (mag >= 1) return 7.5;
  return 6;
}

function pointColor(play, filterMode) {
  if (play.correct === null) return COLOR_NEUTRAL;
  // Dim plays that don't match the current filter (transparent overlay via alpha)
  const base = play.correct ? COLOR_CORRECT : COLOR_INCORRECT;
  if (filterMode === "misses" && play.correct !== false) return "rgba(120,130,143,0.25)";
  if (filterMode === "correct" && play.correct !== true) return "rgba(120,130,143,0.25)";
  return base;
}

function alphaHex(hex, alpha) {
  if (hex.startsWith("rgba")) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

/**
 * Build Chart.js annotations for a football-field-inspired backdrop:
 *   - end-zone bands at y ∈ [-4, 0] and [100, 104]
 *   - goal lines (solid) at y=0, 100
 *   - yard lines (dashed) at every 10
 *   - midfield accent at y=50
 *   - red-zone tint at y ∈ [0, 20]
 *   - yard-line labels on the left edge
 */
function buildFieldAnnotations() {
  const annotations = {
    endOpp: {
      type: "box",
      yMin: -4, yMax: 0,
      backgroundColor: "rgba(0, 53, 148, 0.28)",
      borderColor: "transparent",
      drawTime: "beforeDatasetsDraw",
    },
    endOwn: {
      type: "box",
      yMin: 100, yMax: 104,
      backgroundColor: "rgba(134, 147, 151, 0.14)",
      borderColor: "transparent",
      drawTime: "beforeDatasetsDraw",
    },
    redZone: {
      type: "box",
      yMin: 0, yMax: 20,
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      borderColor: "transparent",
      drawTime: "beforeDatasetsDraw",
    },
    goalOpp: {
      type: "line", yMin: 0, yMax: 0,
      borderColor: "rgba(245, 247, 250, 0.55)",
      borderWidth: 1.5,
      drawTime: "beforeDatasetsDraw",
    },
    goalOwn: {
      type: "line", yMin: 100, yMax: 100,
      borderColor: "rgba(245, 247, 250, 0.55)",
      borderWidth: 1.5,
      drawTime: "beforeDatasetsDraw",
    },
    midfield: {
      type: "line", yMin: 50, yMax: 50,
      borderColor: "rgba(245, 247, 250, 0.45)",
      borderWidth: 1.5,
      borderDash: [],
      drawTime: "beforeDatasetsDraw",
      label: {
        display: true,
        content: "50",
        position: "end",
        backgroundColor: "transparent",
        color: "rgba(245, 247, 250, 0.55)",
        font: { family: "DM Sans", size: 10, weight: 700 },
        padding: 4,
        xAdjust: -12,
        yAdjust: -12,
      },
    },
  };
  // Yard lines at 10, 20, 30, 40, 60, 70, 80, 90
  [10, 20, 30, 40, 60, 70, 80, 90].forEach((y) => {
    annotations[`line${y}`] = {
      type: "line", yMin: y, yMax: y,
      borderColor: "rgba(134, 147, 151, 0.15)",
      borderWidth: 1,
      borderDash: [4, 6],
      drawTime: "beforeDatasetsDraw",
    };
  });
  return annotations;
}

export default function FieldMap({ plays, filter, selectedPlayId, onSelect }) {
  const chartRef = useRef(null);

  const data = useMemo(() => {
    const points = plays.map((p) => ({
      x: p.ydstogo,
      y: p.yardline_100,
      play: p,
    }));

    const bgColors = points.map((pt) => {
      const c = pointColor(pt.play, filter);
      // correct-filter dimming: already handled above; when not dimmed, use 0.78 alpha
      if (c.startsWith("rgba")) return c;
      return alphaHex(c, 0.78);
    });
    const borderColors = points.map((pt) => pointColor(pt.play, filter));

    return {
      datasets: [
        {
          label: "decisions",
          data: points,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: points.map((pt) =>
            pt.play.play_id === selectedPlayId ? 2.5 : 1
          ),
          // Per-point style + radius
          pointStyle: points.map((pt) => decisionShape(pt.play.decision)),
          pointRadius: points.map((pt) => {
            const r = pointRadius(pt.play.go_boost);
            return pt.play.play_id === selectedPlayId ? r + 3 : r;
          }),
          pointHoverRadius: points.map((pt) => pointRadius(pt.play.go_boost) + 3),
          // Selected ring
          pointBorderColor: points.map((pt) =>
            pt.play.play_id === selectedPlayId
              ? COLOR_SELECTED_RING
              : pointColor(pt.play, filter)
          ),
        },
      ],
    };
  }, [plays, filter, selectedPlayId]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { left: 20, right: 20, top: 10, bottom: 10 } },
      onClick: (_evt, elements) => {
        if (!elements || elements.length === 0) return;
        const idx = elements[0].index;
        const pt = data.datasets[0].data[idx];
        if (onSelect && pt?.play) onSelect(pt.play);
      },
      scales: {
        x: {
          type: "linear",
          min: 0, max: 22,
          title: {
            display: true,
            text: "YARDS TO GO",
            color: "#869397",
            font: { family: "DM Sans", size: 10, weight: 700 },
            padding: 12,
          },
          ticks: {
            color: "#7d8693",
            stepSize: 2,
            font: { family: "DM Sans", size: 11 },
          },
          grid: { color: "rgba(134, 147, 151, 0.05)", drawTicks: false },
          border: { color: "rgba(134, 147, 151, 0.25)" },
        },
        y: {
          type: "linear",
          min: -4, max: 104,
          reverse: true,
          title: {
            display: true,
            text: "FIELD POSITION  (yards from opponent end zone)",
            color: "#869397",
            font: { family: "DM Sans", size: 10, weight: 700 },
            padding: 12,
          },
          ticks: {
            color: "#7d8693",
            stepSize: 10,
            font: { family: "DM Sans", size: 11 },
            callback: (v) => {
              if (v === 0) return "GOAL";
              if (v === 50) return "50";
              if (v === 100) return "GOAL";
              if (v < 0 || v > 100) return "";
              if (v < 50) return v;
              return 100 - v;
            },
          },
          grid: { drawOnChartArea: false },
          border: { color: "rgba(134, 147, 151, 0.25)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#05080f",
          titleColor: "#c0c8d0",
          bodyColor: "#f5f7fa",
          borderColor: "#869397",
          borderWidth: 1,
          padding: 14,
          cornerRadius: 2,
          displayColors: false,
          titleFont: {
            family: "Libre Baskerville",
            size: 14,
            weight: 700,
          },
          bodyFont: { family: "DM Sans", size: 12, weight: 500 },
          bodySpacing: 6,
          callbacks: {
            title: (items) => {
              const p = items[0].raw.play;
              const opp = TEAM_SHORT[p.defteam] || p.defteam;
              return `Week ${p.week} vs ${opp}`;
            },
            label: (item) => {
              const p = item.raw.play;
              const lines = [
                `4th & ${p.ydstogo}  ·  ${fieldPosition(p.yardline_100)}`,
                `Q${p.qtr}  ·  ${scoreText(p.score_differential)}`,
                `Dallas ${actionText(p.decision)}`,
              ];
              if (p.go_boost !== null && p.go_boost !== undefined) {
                const sign = p.go_boost >= 0 ? "+" : "";
                lines.push(`Go-boost: ${sign}${p.go_boost.toFixed(2)} WP`);
              }
              return lines;
            },
            afterBody: () => ["", "Click for full breakdown →"],
          },
        },
        annotation: { annotations: buildFieldAnnotations() },
      },
    }),
    [data, onSelect]
  );

  return (
    <>
      <div className="field-shell">
        <div className="field-wrap">
          <Scatter ref={chartRef} data={data} options={options} />
        </div>
        <div className="field-legend">
          <div className="group">
            <span className="group-label">Outcome</span>
            <span>
              <span className="legend-dot" style={{ background: COLOR_CORRECT }} />
              Correct
            </span>
            <span>
              <span className="legend-dot" style={{ background: COLOR_INCORRECT }} />
              Incorrect
            </span>
            <span>
              <span className="legend-dot" style={{ background: COLOR_NEUTRAL }} />
              Not scored
            </span>
          </div>
          <div className="group">
            <span className="group-label">Decision</span>
            <span>
              <span className="legend-shape circle" />
              Went for it
            </span>
            <span>
              <span className="legend-shape triangle" />
              Kicked FG
            </span>
            <span>
              <span className="legend-shape diamond" />
              Punted
            </span>
          </div>
          <div className="group">
            <span className="group-label">Size</span>
            <span>Larger dot = higher stakes (|go-boost|)</span>
          </div>
        </div>
      </div>
      <p className="field-hint">
        Click any play to see the full three-option breakdown below.
      </p>
    </>
  );
}
