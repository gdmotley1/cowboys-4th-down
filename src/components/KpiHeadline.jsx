export default function KpiHeadline({ summary }) {
  const wp = summary.wp_left_on_table;
  const expectedWins = (wp / 100).toFixed(2);
  const correctPct = (summary.correct_pct * 100).toFixed(0);

  return (
    <section className="kpi">
      <div>
        <div className="kpi-label">Cost of conservative calls · 2025</div>
        <h1 className="kpi-value serif num">
          {wp.toFixed(1)}<span className="unit">WP pts</span>
        </h1>
        <p className="kpi-blurb">
          Across <strong className="num">{summary.total_decisions}</strong> analytically-scored 4th-down decisions in 2025,
          Dallas chose the model-preferred option <strong className="num">{correctPct}%</strong> of the time.
          The rest — the punts and kicks the model wanted to be go-for-its — surrendered
          roughly <strong className="num">{expectedWins} expected wins</strong> in a 7-9-1 season.
        </p>
      </div>
      <div className="kpi-side">
        <div className="kpi-metric">
          <div className="k">Model agreement</div>
          <div className="v num">{correctPct}%</div>
          <div className="sub">{summary.correct_count} of {summary.total_decisions}</div>
        </div>
        <div className="kpi-metric">
          <div className="k">Missed opportunities</div>
          <div className="v num">{summary.incorrect_count}</div>
          <div className="sub">conservative + overly aggressive</div>
        </div>
        <div className="kpi-metric">
          <div className="k">Went for it</div>
          <div className="v num">{summary.went_for_it_count}</div>
          <div className="sub">{summary.went_for_it_converted} converted</div>
        </div>
        <div className="kpi-metric">
          <div className="k">Kicked or punted</div>
          <div className="v num">{summary.punted_count + summary.field_goal_count}</div>
          <div className="sub">{summary.field_goal_count} FG · {summary.punted_count} punt</div>
        </div>
      </div>
    </section>
  );
}
