export default function KpiHeadline({ summary }) {
  const wpTotal = summary.wp_left_on_table;
  const expectedWins = (wpTotal / 100).toFixed(2);
  const correctPct = (summary.correct_pct * 100).toFixed(1);

  return (
    <div className="kpi panel">
      <span className="corner-bl" />
      <span className="corner-br" />

      <div className="kpi-main">
        <div className="kpi-label">Cost of Conservative Calls · 2025</div>
        <div className="kpi-value mono">
          +{wpTotal.toFixed(1)}<span style={{ fontSize: "0.45em", marginLeft: 12, letterSpacing: 0.12, color: "var(--alert-dim)" }}>WP PTS</span>
        </div>
      </div>

      <div className="kpi-side">
        <div className="row">
          <span className="k">Expected wins lost</span>
          <span className="v mono">≈ {expectedWins}</span>
        </div>
        <div className="row">
          <span className="k">Model agreement</span>
          <span className="v mono">{correctPct}%</span>
        </div>
        <div className="row">
          <span className="k">Missed opportunities</span>
          <span className="v mono">{summary.incorrect_count} of {summary.total_decisions}</span>
        </div>
        <div className="row">
          <span className="k">Went for it / converted</span>
          <span className="v mono">{summary.went_for_it_count} / {summary.went_for_it_converted}</span>
        </div>
      </div>
    </div>
  );
}
