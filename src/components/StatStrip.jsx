function fmtPct(p) { return `${(p * 100).toFixed(1)}%`; }

export default function StatStrip({ summary }) {
  const items = [
    {
      label: "Decisions",
      value: summary.total_plays,
      sub: `${summary.total_decisions} scored by nfl4th`,
    },
    {
      label: "Model Agreement",
      value: fmtPct(summary.correct_pct),
      sub: `${summary.correct_count} of ${summary.total_decisions} calls`,
      accent: "green",
    },
    {
      label: "WP Left on Table",
      value: summary.wp_left_on_table.toFixed(1),
      sub: "from conservative calls",
      accent: "red",
    },
    {
      label: "Went For It",
      value: summary.went_for_it_count,
      sub: `${summary.went_for_it_converted} converted · ${summary.punted_count} punts · ${summary.field_goal_count} FGs`,
    },
  ];

  return (
    <section className="stat-strip">
      {items.map((i) => (
        <div key={i.label} className="stat-strip-item">
          <div className="label">{i.label}</div>
          <div className={`value${i.accent ? ` accent-${i.accent}` : ""}`}>
            {i.value}
          </div>
          <div className="sub">{i.sub}</div>
        </div>
      ))}
    </section>
  );
}
