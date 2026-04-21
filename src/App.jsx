import { useMemo, useState } from "react";
import StatusBar from "./components/StatusBar.jsx";
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
    // Prefer the biggest miss in the cell; fall back to biggest |go_boost|
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
      <StatusBar summary={summary} />

      <div className="app-body">
        <KpiHeadline summary={summary} />

        {/* WORKSPACE — field + decision grid side by side */}
        <div className="workspace">
          <div className="panel">
            <span className="corner-bl" />
            <span className="corner-br" />
            <div className="panel-head">
              <span className="panel-id">MAP·01 · DECISION LANDSCAPE</span>
              <div className="filters">
                <button
                  className={`filter-btn${filter === "all" ? " active" : ""}`}
                  onClick={() => setFilter("all")}
                  type="button"
                >
                  ALL<span className="n">{counts.all}</span>
                </button>
                <button
                  className={`filter-btn${filter === "misses" ? " active" : ""}`}
                  onClick={() => setFilter("misses")}
                  type="button"
                >
                  MISSES<span className="n">{counts.misses}</span>
                </button>
                <button
                  className={`filter-btn${filter === "correct" ? " active" : ""}`}
                  onClick={() => setFilter("correct")}
                  type="button"
                >
                  MATCHED<span className="n">{counts.correct}</span>
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
            <span className="corner-bl" />
            <span className="corner-br" />
            <div className="panel-head">
              <span className="panel-id">GRID·02 · COST BY SITUATION</span>
              <span>DIST × FIELD ZONE · WP FORFEITED</span>
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

        {/* Detail panel spans full width */}
        <DetailPanel play={selectedPlay} />
      </div>

      <footer className="foot">
        <span>DATA · nflfastR · 2025 REG · 17 GP · 113 PLAYS · 107 SCORED</span>
        <span>
          MODEL · nfl4th v1.0.7 · Ben Baldwin · <a href="https://rbsdm.com/stats/fourth_downs/" target="_blank" rel="noreferrer">rbsdm.com</a>
        </span>
        <span>
          PREPARED BY GRANT MOTLEY ·
          <a href="https://github.com/gdmotley1/cowboys-4th-down" target="_blank" rel="noreferrer"> GITHUB </a>
        </span>
      </footer>
    </div>
  );
}
