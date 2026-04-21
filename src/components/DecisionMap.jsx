import { useMemo } from "react";
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
    went_for_it: "Went for it",
    punted: "Punted",
    field_goal: "Kicked FG",
    other: "No play / kneel",
  }[decision];
}

function recommendedText(play) {
  if (play.correct === null || play.correct === true) return null;
  if (play.go_boost > 0 && play.decision !== "went_for_it") {
    return "Model said: GO FOR IT";
  }
  if (play.go_boost <= 0 && play.decision === "went_for_it") {
    return "Model said: kick / punt";
  }
  return null;
}

function pointColor(play) {
  if (play.correct === null) return COLOR_NEUTRAL;
  return play.correct ? COLOR_CORRECT : COLOR_INCORRECT;
}

export default function DecisionMap({ plays }) {
  const data = useMemo(() => {
    const points = plays.map((p) => ({
      x: p.ydstogo,
      y: p.yardline_100,
      play: p,
    }));

    return {
      datasets: [
        {
          label: "4th-down decisions",
          data: points,
          backgroundColor: points.map((pt) =>
            pointColor(pt.play) + "bf" // 0.75 alpha
          ),
          borderColor: points.map((pt) => pointColor(pt.play)),
          borderWidth: 1,
          pointRadius: 7,
          pointHoverRadius: 10,
        },
      ],
    };
  }, [plays]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 21,
          title: {
            display: true,
            text: "Yards to Go",
            color: "#c0c8d0",
            font: { family: "DM Sans", size: 13, weight: 600 },
          },
          ticks: {
            color: "#9ca3af",
            stepSize: 2,
            font: { family: "DM Sans", size: 11 },
          },
          grid: { color: "rgba(134, 147, 151, 0.12)" },
        },
        y: {
          type: "linear",
          min: 0,
          max: 100,
          reverse: true, // opponent EZ (yardline_100=0) on top
          title: {
            display: true,
            text: "Field Position  (← opponent end zone · own end zone →)",
            color: "#c0c8d0",
            font: { family: "DM Sans", size: 13, weight: 600 },
          },
          ticks: {
            color: "#9ca3af",
            stepSize: 10,
            font: { family: "DM Sans", size: 11 },
            callback: (v) => {
              if (v === 0) return "Opp EZ";
              if (v === 50) return "50";
              if (v === 100) return "Own EZ";
              if (v < 50) return `opp ${v}`;
              return `own ${100 - v}`;
            },
          },
          grid: { color: "rgba(134, 147, 151, 0.12)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0a0f1e",
          titleColor: "#c0c8d0",
          bodyColor: "#ffffff",
          borderColor: "#869397",
          borderWidth: 1,
          padding: 12,
          titleFont: {
            family: "DM Sans",
            size: 13,
            weight: 700,
          },
          bodyFont: { family: "DM Sans", size: 12 },
          callbacks: {
            title: (items) => {
              const p = items[0].raw.play;
              const opp = TEAM_SHORT[p.defteam] || p.defteam;
              return `Week ${p.week} vs ${opp}`;
            },
            label: (item) => {
              const p = item.raw.play;
              const fp = fieldPosition(p.yardline_100);
              const rec = recommendedText(p);
              const lines = [
                `4th & ${p.ydstogo} from ${fp}`,
                `Q${p.qtr} · ${scoreText(p.score_differential)}`,
                `Did: ${actionText(p.decision)}`,
              ];
              if (p.go_boost !== null && p.go_boost !== undefined) {
                const sign = p.go_boost >= 0 ? "+" : "";
                lines.push(
                  `Go boost: ${sign}${p.go_boost.toFixed(2)} WP pts`
                );
              }
              if (rec) lines.push(rec);
              return lines;
            },
            afterBody: (items) => {
              const d = items[0].raw.play.desc;
              if (!d) return "";
              const short = d.length > 140 ? d.slice(0, 140) + "…" : d;
              return ["", short];
            },
          },
        },
        annotation: {
          annotations: {
            midfield: {
              type: "line",
              yMin: 50,
              yMax: 50,
              borderColor: "rgba(134, 147, 151, 0.45)",
              borderWidth: 1,
              borderDash: [6, 6],
              label: {
                display: true,
                content: "Midfield",
                position: "end",
                backgroundColor: "transparent",
                color: "#869397",
                font: { family: "DM Sans", size: 10, weight: 600 },
                padding: 2,
              },
            },
          },
        },
      },
    }),
    []
  );

  return (
    <section className="section">
      <div>
        <p className="section-title">The Map</p>
        <h2 className="section-heading">Every 4th-down decision, 2025</h2>
      </div>

      <div className="chart-shell">
        <div className="chart-wrap">
          <Scatter data={data} options={options} />
        </div>
        <div className="chart-legend">
          <span>
            <span
              className="swatch"
              style={{ background: COLOR_CORRECT }}
            />
            Correct decision
          </span>
          <span>
            <span
              className="swatch"
              style={{ background: COLOR_INCORRECT }}
            />
            Incorrect decision
          </span>
          <span>
            <span
              className="swatch"
              style={{ background: COLOR_NEUTRAL }}
            />
            Not scored (late clock / kneel)
          </span>
        </div>
      </div>
    </section>
  );
}
