export default function Masthead({ summary }) {
  const wp = summary.wp_left_on_table.toFixed(1);
  const exp = (summary.wp_left_on_table / 100).toFixed(2);
  const correctPct = Math.round(summary.correct_pct * 100);

  return (
    <header className="masthead">
      <div className="masthead-row">
        <div className="mark">
          <svg className="mark-star" viewBox="0 0 100 100" aria-hidden="true">
            <polygon
              points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"
              fill="#ffffff"
            />
          </svg>
          <div className="mark-text">
            <span className="mark-title">Cowboys Fourth-Down Intelligence</span>
            <span className="mark-sub">
              2025 Regular Season · Prepared by Grant Motley
            </span>
          </div>
        </div>
        <div className="masthead-stats">
          <div className="ms-stat">
            <span className="ms-k">WP surrendered</span>
            <span className="ms-v alert num">{wp}</span>
          </div>
          <div className="ms-stat">
            <span className="ms-k">Expected wins lost</span>
            <span className="ms-v num">≈ {exp}</span>
          </div>
          <div className="ms-stat">
            <span className="ms-k">Model agreement</span>
            <span className="ms-v num">{correctPct}%</span>
          </div>
          <div className="ms-stat">
            <span className="ms-k">Misses / decisions</span>
            <span className="ms-v num">
              {summary.incorrect_count} <span className="dim">/</span>{" "}
              {summary.total_decisions}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
