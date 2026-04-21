export default function Hero({ summary }) {
  const wpLost = summary.wp_left_on_table;
  // Convert WP points to expected-wins-lost. 1 WP pt ≈ 0.01 wins.
  const expectedWins = (wpLost / 100).toFixed(1);
  const correctPct = Math.round(summary.correct_pct * 100);

  return (
    <section className="hero">
      <div className="hero-eyebrow">Report No. 01 · 4th-Down Decision Quality</div>
      <h1 className="hero-title">
        The cost of the <span className="accent">conservative call.</span>
      </h1>
      <p className="hero-lede">
        In 2025, Dallas faced{" "}
        <strong className="num">{summary.total_plays}</strong> real 4th-down
        situations and made the analytically-recommended call on{" "}
        <strong className="num">{correctPct}%</strong> of the{" "}
        <strong className="num">{summary.total_decisions}</strong> plays the
        win-probability model scores. The 30% where they went conservative —
        punting or kicking when the model said <em>go</em> — surrendered{" "}
        <strong className="num">{wpLost.toFixed(1)} win-probability points</strong>, roughly{" "}
        <strong className="num">{expectedWins} expected wins</strong> in a 7-9-1 season.
      </p>
    </section>
  );
}
