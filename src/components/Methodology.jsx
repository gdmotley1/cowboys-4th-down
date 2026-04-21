export default function Methodology() {
  return (
    <footer className="methodology">
      <div className="methodology-grid">
        <div className="methodology-col">
          <h4>Data</h4>
          <p>
            Play-by-play from{" "}
            <a href="https://github.com/nflverse/nflreadr" target="_blank" rel="noreferrer">
              nflverse / nflreadr
            </a>{" "}
            (the nflfastR release), filtered to Dallas 4th-down plays from the
            2025 regular season. 123 raw plays, 10 dropped as no-plays, 113
            retained; 107 scorable by the model.
          </p>
        </div>
        <div className="methodology-col">
          <h4>Model</h4>
          <p>
            Win-probability and go-for-it decision model from{" "}
            <a href="https://github.com/nflverse/nfl4th" target="_blank" rel="noreferrer">
              nfl4th
            </a>{" "}
            v1.0.7 — the same package that powers{" "}
            <a href="https://rbsdm.com/stats/fourth_downs/" target="_blank" rel="noreferrer">
              rbsdm.com
            </a>
            . <em>go-boost</em> is the WP gain from choosing <em>go</em> over
            the best kick/punt option, in percentage points.
          </p>
        </div>
        <div className="methodology-col">
          <h4>Validation</h4>
          <p>
            Counts cross-checked against NFL.com and ESPN 2025 team stats:
            games (17 ✓), punts on 4th (41 ✓), go-for-it conversions (22 ✓).
            One 1-play diff on attempts traces to a Week 11 QB kneel that the
            model correctly excludes from strategic scoring.
          </p>
        </div>
      </div>
      <div className="methodology-sig">
        <span>Prepared by <strong>Grant Motley</strong></span>
        <span>
          <a
            href="https://github.com/gdmotley1/cowboys-4th-down"
            target="_blank"
            rel="noreferrer"
          >
            github.com/gdmotley1/cowboys-4th-down
          </a>
        </span>
      </div>
    </footer>
  );
}
