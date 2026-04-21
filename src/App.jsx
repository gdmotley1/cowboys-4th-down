import { useMemo, useState } from "react";
import Masthead from "./components/Masthead.jsx";
import FootballField from "./components/FootballField.jsx";
import DecisionGrid from "./components/DecisionGrid.jsx";
import DetailPanel from "./components/DetailPanel.jsx";

import playsData from "./data/fourth_down_data.json";
import summary from "./data/summary_stats.json";

export default function App() {
  // Field starts focused on misses — that IS the story.
  const [filter, setFilter] = useState("misses");
  const [selectedPlayId, setSelectedPlayId] = useState(null);
  const [selectedCellKey, setSelectedCellKey] = useState(null);

  const counts = useMemo(() => ({
    all: playsData.length,
    misses: playsData.filter((p) => p.correct === false).length,
    matched: playsData.filter((p) => p.correct === true).length,
  }), []);

  const selectedPlay = useMemo(
    () => playsData.find((p) => p.play_id === selectedPlayId) || null,
    [selectedPlayId]
  );

  const handlePlayClick = (play) => {
    if (!play) return setSelectedPlayId(null);
    setSelectedPlayId((curr) => (curr === play.play_id ? null : play.play_id));
    setSelectedCellKey(null);
  };

  const handleCellClick = (cellKey, playsInCell) => {
    setSelectedCellKey(cellKey);
    if (!playsInCell.length) return;
    const misses = playsInCell.filter(
      (p) => p.correct === false && p.go_boost != null
    );
    const pick = (misses.length ? misses : playsInCell).slice().sort(
      (a, b) => Math.abs(b.go_boost ?? 0) - Math.abs(a.go_boost ?? 0)
    )[0];
    setSelectedPlayId(pick.play_id);
  };

  return (
    <div className="app">
      <Masthead summary={summary} />

      <main className="app-body">
        {/* FIELD — floating, no panel box, just a header strip + SVG */}
        <section className="field-section">
          <div className="field-header">
            <div className="field-title-group">
              <h2 className="field-title">Decision landscape</h2>
              <p className="field-sub">
                {filter === "misses" && (
                  <>
                    <strong className="alert-text num">{counts.misses}</strong> missed opportunities, plotted by yards-to-go and field position. Larger marker = higher stakes.
                  </>
                )}
                {filter === "matched" && (
                  <>
                    <strong className="num">{counts.matched}</strong> calls that matched the model, for context.
                  </>
                )}
                {filter === "all" && (
                  <>
                    All <strong className="num">{counts.all}</strong> decisions — misses in amber, matched calls in silver.
                  </>
                )}
              </p>
            </div>
            <div className="filters">
              <button
                className={`filter-btn${filter === "misses" ? " active" : ""}`}
                onClick={() => setFilter("misses")}
                type="button"
              >
                Misses<span className="n num">{counts.misses}</span>
              </button>
              <button
                className={`filter-btn${filter === "matched" ? " active" : ""}`}
                onClick={() => setFilter("matched")}
                type="button"
              >
                Matched<span className="n num">{counts.matched}</span>
              </button>
              <button
                className={`filter-btn${filter === "all" ? " active" : ""}`}
                onClick={() => setFilter("all")}
                type="button"
              >
                All<span className="n num">{counts.all}</span>
              </button>
            </div>
          </div>

          <FootballField
            plays={playsData}
            filter={filter}
            selectedPlayId={selectedPlayId}
            onSelect={handlePlayClick}
          />
        </section>

        <DetailPanel
          play={selectedPlay}
          allPlays={playsData}
          onSelect={handlePlayClick}
        />

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Cost by situation</h3>
              <div className="panel-sub">
                Distance × field zone. Brighter = more WP surrendered. Click any
                cell to drill into its worst miss.
              </div>
            </div>
          </div>
          <div className="panel-body">
            <DecisionGrid
              plays={playsData}
              selectedCellKey={selectedCellKey}
              onCellSelect={handleCellClick}
            />
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>
          <strong>Data</strong> nflfastR · 2025 regular season · 17 GP · 113 plays · 107 scored
        </span>
        <span>
          <strong>Model</strong> nfl4th v1.0.7 (Ben Baldwin) ·{" "}
          <a href="https://rbsdm.com/stats/fourth_downs/" target="_blank" rel="noreferrer">rbsdm.com</a>
        </span>
        <span>
          Prepared by Grant Motley ·{" "}
          <a href="https://github.com/gdmotley1/cowboys-4th-down" target="_blank" rel="noreferrer">github</a>
        </span>
      </footer>
    </div>
  );
}
