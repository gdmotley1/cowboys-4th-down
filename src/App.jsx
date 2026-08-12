import { useMemo, useState } from "react";
import Masthead from "./components/Masthead.jsx";
import FootballField from "./components/FootballField.jsx";
import DecisionGrid from "./components/DecisionGrid.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import KpiHeadline from "./components/KpiHeadline.jsx";
import {
  DECISION_VIEWS,
  getViewCounts,
  playKey,
} from "./lib/decisionFilters.js";

import playsData from "./data/fourth_down_data.json";
import summary from "./data/summary_stats.json";

export default function App() {
  const [filter, setFilter] = useState("misses");
  const [selectedPlayKey, setSelectedPlayKey] = useState(null);
  const [selectedCellKey, setSelectedCellKey] = useState(null);

  const counts = useMemo(() => getViewCounts(playsData), []);

  const selectedPlay = useMemo(
    () => playsData.find((p) => playKey(p) === selectedPlayKey) || null,
    [selectedPlayKey]
  );

  const handlePlayClick = (play) => {
    if (!play) return setSelectedPlayKey(null);
    const key = playKey(play);
    setSelectedPlayKey((curr) => (curr === key ? null : key));
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
    setSelectedPlayKey(playKey(pick));
  };

  const activeView = DECISION_VIEWS.find((view) => view.key === filter);

  return (
    <div className="app">
      <Masthead summary={summary} />

      <main className="app-body">
        <KpiHeadline summary={summary} plays={playsData} />

        <section className="field-section">
          <div className="field-header">
            <div className="field-title-group">
              <h2 className="field-title">Decision landscape</h2>
              <p className="field-sub">
                <strong className={["misses", "conservative", "aggressive"].includes(filter) ? "alert-text num" : "num"}>
                  {counts[filter]}
                </strong>{" "}
                {activeView?.short.toLowerCase()}, plotted by field position and yards to go.
                Marker size tracks model edge.
              </p>
            </div>
            <div className="filters" aria-label="Decision view">
              {DECISION_VIEWS.map((view) => (
                <button
                  key={view.key}
                  className={`filter-btn${filter === view.key ? " active" : ""}`}
                  onClick={() => setFilter(view.key)}
                  aria-label={`${view.label}: ${counts[view.key]} plays`}
                  type="button"
                >
                  {view.label}<span className="n num">{counts[view.key]}</span>
                </button>
              ))}
            </div>
          </div>

          <FootballField
            plays={playsData}
            filter={filter}
            selectedPlayKey={selectedPlayKey}
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
                Distance by field zone. Brighter cells contain more win probability
                surrendered by missed calls.
              </div>
            </div>
          </div>
          <div className="panel-body grid-scroll">
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
          <strong>Data</strong> nflfastR · {summary.season} regular season ·{" "}
          {summary.total_plays} plays · {summary.total_decisions} scored
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
