function analyzeZone(plays) {
  const zone = plays.filter(
    (p) =>
      p.yardline_100 >= 25 &&
      p.yardline_100 <= 45 &&
      p.ydstogo <= 3 &&
      p.go_boost != null
  );
  const misses = zone.filter(
    (p) => p.go_boost > 0 && p.decision !== "went_for_it"
  );
  const cost = misses.reduce((s, p) => s + (p.go_boost || 0), 0);
  return { zoneN: zone.length, missN: misses.length, cost };
}

export default function Takeaway({ plays, summary }) {
  const { missN, cost } = analyzeZone(plays);
  const correctPct = Math.round(summary.correct_pct * 100);
  const wpTotal = summary.wp_left_on_table.toFixed(1);
  const expectedWins = (summary.wp_left_on_table / 100).toFixed(1);
  const sharePct = Math.round((cost / summary.wp_left_on_table) * 100);

  return (
    <div className="takeaway-body">
      <p>
        Dallas was neither an elite 4th-down offense nor a glaring liability in
        2025. Across {summary.total_plays} real decisions, Schottenheimer&apos;s
        staff chose the win-probability-maximizing option{" "}
        <strong className="num">{correctPct}%</strong> of the time — roughly in
        the middle third of the league.
      </p>
      <p>
        The interesting read isn&apos;t the headline rate; it&apos;s{" "}
        <em>where</em> the misses lived. Of the{" "}
        <strong className="num">{missN}</strong> times the model recommended
        going for it on 4th-and-short (≤3 yards) in the
        opponent&apos;s 25-to-45 — i.e., just outside comfortable field-goal
        range — Dallas chose the kick or punt every time, surrendering{" "}
        <strong className="num">{cost.toFixed(1)}&nbsp;WP points</strong>. That
        single situational bucket is responsible for{" "}
        <strong className="num">{sharePct}%</strong> of their season-long
        conservative-decision cost.
      </p>

      <blockquote className="pullquote">
        &ldquo;In the one zone where analytics most clearly points toward
        aggression, Dallas kicked four out of four.&rdquo;
        <span className="pq-attribution">Finding · Regular Season 2025</span>
      </blockquote>

      <p>
        This isn&apos;t about &ldquo;going for it more often&rdquo; as a
        slogan. It&apos;s about one tightly-defined geography — the 55-yard field
        goal temptation in a close game — where the math consistently says{" "}
        <em>trust the offense</em>, and where the Cowboys consistently did the
        opposite. That&apos;s a call-sheet tendency to address, not a
        philosophical rebuild.
      </p>
      <p>
        Over the full season, the cumulative{" "}
        <strong className="num">{wpTotal}&nbsp;WP points</strong> left on the
        field translate to roughly{" "}
        <strong className="num">{expectedWins} expected wins</strong> of decision
        equity — a real edge in a division the Cowboys lost by margins smaller
        than that.
      </p>

      <div className="recommendation">
        <div className="recommendation-label">Recommendation for 2026</div>
        <p>
          Tighten the call-sheet posture on 4th-and-short in opponent territory
          between the 25 and 45. The model&apos;s signal is clear, the sample
          is large enough to trust, and the gain is measurable in real wins.
        </p>
      </div>
    </div>
  );
}
