import { useMemo, useState } from "react";
import Masthead from "./components/Masthead.jsx";
import KpiHeadline from "./components/KpiHeadline.jsx";
import FootballField from "./components/FootballField.jsx";
import DecisionGrid from "./components/DecisionGrid.jsx";
import DetailPanel from "./components/DetailPanel.jsx";

import playsData from "./data/fourth_down_data.json";
import summary from "./data/summary_stats.json";

export default function App() {
  const [filter, setFilter] = useState("all"); // all | misses | correct
  const [selectedPlayId, setSelectedPlayId] = useState(null);
  const [selectedCellKey, setSelectedCellKey] = useState(null);

  const counts = useMemo(() => ({
    all: playsData.length,
    misses: playsData.filter((p) => p.correct === false).length,
    correct: playsData.filter((p) => p.correct === true).length,
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
        <KpiHeadline summary={summary} />

        <div className="workspace">
          <div className="workspace-left">
            <div className="panel">
              <div className="panel-head">
                <h3>Decision landscape</h3>
                <div className="filters">
                  <button
                    className={`filter-btn${filter === "all" ? " active" : ""}`}
                    onClick={() => setFilter("all")}
                    type="button"
                  >
                    All<span className="n num">{counts.all}</span>
                  </button>
                  <button
                    className={`filter-btn${filter === "misses" ? " active" : ""}`}
                    onClick={() => setFilter("misses")}
                    type="button"
                  >
                    Misses<span className="n num">{counts.misses}</span>
                  </button>
                  <button
                    className={`filter-btn${filter === "correct" ? " active" : ""}`}
                    onClick={() => setFilter("correct")}
                    type="button"
                  >
                    Matched<span className="n num">{counts.correct}</span>
                  </button>
                </div>
              </div>
              <FootballField
                plays={playsData}
                filter={filter}
                selectedPlayId={selectedPlayId}
                onSelect={handlePlayClick}
              />
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Cost by situation</h3>
                <span className="muted">
                  Distance × field zone — brighter = more WP surrendered
                </span>
              </div>
              <div className="panel-body">
                <DecisionGrid
                  plays={playsData}
                  selectedCellKey={selectedCellKey}
                  onCellSelect={handleCellClick}
                />
              </div>
            </div>
          </div>

          <aside className="workspace-right">
            <DetailPanel
              play={selectedPlay}
              allPlays={playsData}
              onSelect={handlePlayClick}
            />
          </aside>
        </div>
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
