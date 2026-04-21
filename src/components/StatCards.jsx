function formatPct(p) {
  return `${(p * 100).toFixed(1)}%`;
}

export default function StatCards({ summary }) {
  const {
    total_plays,
    total_decisions,
    correct_count,
    correct_pct,
    wp_left_on_table,
    went_for_it_count,
    went_for_it_converted,
    punted_count,
    field_goal_count,
  } = summary;

  const cards = [
    {
      label: "Total 4th-Down Decisions",
      value: total_plays,
      sub: `${total_decisions} scored by the nfl4th model`,
    },
    {
      label: "Correct Calls",
      value: formatPct(correct_pct),
      sub: `${correct_count} of ${total_decisions} matched the model`,
      accent: "green",
    },
    {
      label: "WP Points Left on Table",
      value: wp_left_on_table.toFixed(1),
      sub: "From conservative decisions (win-prob points)",
      accent: "red",
    },
    {
      label: "Times Went For It",
      value: went_for_it_count,
      sub: `${went_for_it_converted} converted · ${punted_count} punts · ${field_goal_count} FGs`,
    },
  ];

  return (
    <section className="stat-cards">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`stat-card${c.accent ? ` accent-${c.accent}` : ""}`}
        >
          <div className="label">{c.label}</div>
          <div className="value">{c.value}</div>
          <div className="sub">{c.sub}</div>
        </div>
      ))}
    </section>
  );
}
