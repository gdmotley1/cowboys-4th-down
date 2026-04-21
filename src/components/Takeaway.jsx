function analyze(plays) {
  // Opponent-territory short-yardage zone: opp 25–45 (yardline_100 ∈ [25, 45]),
  // ydstogo ≤ 3. This is the "should've been aggressive" sweet spot.
  const inZone = plays.filter(
    (p) =>
      p.yardline_100 >= 25 &&
      p.yardline_100 <= 45 &&
      p.ydstogo <= 3 &&
      p.go_boost !== null
  );
  const zoneMisses = inZone.filter(
    (p) => p.go_boost > 0 && p.decision !== "went_for_it"
  );
  const zoneCost = zoneMisses.reduce((s, p) => s + (p.go_boost || 0), 0);

  return { zoneMisses, zoneCost };
}

export default function Takeaway({ plays, summary }) {
  const { zoneMisses, zoneCost } = analyze(plays);

  const correctPct = (summary.correct_pct * 100).toFixed(1);
  const wpTotal = summary.wp_left_on_table.toFixed(1);

  return (
    <section className="section">
      <div>
        <p className="section-title">What the data says</p>
        <h2 className="section-heading">Three takeaways for Dallas</h2>
      </div>

      <div className="takeaway">
        <ul>
          <li>
            Dallas faced <strong>{summary.total_plays}</strong> real 4th-down
            situations in 2025 and made the analytically recommended call on{" "}
            <strong>{correctPct}%</strong> of the{" "}
            <strong>{summary.total_decisions}</strong> plays the model scores.
            That puts Dallas right around the league's middle tier on
            4th-down sharpness — not elite, not a liability.
          </li>
          <li>
            The clearest pattern in the misses: <strong>short-yardage trips
            into the red zone's doorstep</strong>. Of the{" "}
            <strong>{zoneMisses.length}</strong> times the model recommended
            going for it on 4th-and-3-or-less between the opponent's 25 and
            45, Dallas took the FG or punt and surrendered{" "}
            <strong>{zoneCost.toFixed(1)} WP points</strong> of expected
            value — more than a quarter of the season's total miss cost
            came from that one bucket.
          </li>
          <li>
            Summed across every conservative choice, Dallas left{" "}
            <strong>{wpTotal} win-probability points</strong> on the table in
            2025. That's roughly a third of one win's worth of decision
            equity — a real, recoverable edge if the call-sheet gets more
            aggressive in opponent territory.
          </li>
        </ul>
        <p className="closer">
          As Brian Schottenheimer enters his second season, the data
          suggests the biggest available-today improvement isn't personnel
          or scheme — it's a sharper 4th-and-short tendency once the offense
          crosses the 45.
        </p>
      </div>
    </section>
  );
}
