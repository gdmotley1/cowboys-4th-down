import { useMemo, useState } from "react";
import Masthead from "./components/Masthead.jsx";
import Hero from "./components/Hero.jsx";
import StatStrip from "./components/StatStrip.jsx";
import FilterBar from "./components/FilterBar.jsx";
import FieldMap from "./components/FieldMap.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import CostliestPlays from "./components/CostliestPlays.jsx";
import Takeaway from "./components/Takeaway.jsx";
import Methodology from "./components/Methodology.jsx";

import plays from "./data/fourth_down_data.json";
import summary from "./data/summary_stats.json";

export default function App() {
  const [filter, setFilter] = useState("all");
  const [selectedPlayId, setSelectedPlayId] = useState(null);

  const counts = useMemo(() => ({
    all: plays.length,
    misses: plays.filter((p) => p.correct === false).length,
    correct: plays.filter((p) => p.correct === true).length,
  }), []);

  // Selected play (full object), or null
  const selectedPlay = useMemo(
    () => plays.find((p) => p.play_id === selectedPlayId) || null,
    [selectedPlayId]
  );

  const handleSelect = (play) => {
    if (!play) return setSelectedPlayId(null);
    // Toggle off if clicking the same play again
    setSelectedPlayId((curr) => (curr === play.play_id ? null : play.play_id));
  };

  return (
    <div className="app">
      <Masthead />
      <Hero summary={summary} />
      <StatStrip summary={summary} />

      <section className="section" id="map">
        <div className="section-header">
          <div>
            <div className="section-kicker">§ 01 · The Map</div>
            <h2 className="section-title">Every 4th-down decision, 2025</h2>
          </div>
        </div>
        <FilterBar
          filter={filter}
          counts={counts}
          onChange={(f) => setFilter(f)}
        />
        <FieldMap
          plays={plays}
          filter={filter}
          selectedPlayId={selectedPlayId}
          onSelect={handleSelect}
        />
        <DetailPanel play={selectedPlay} />
      </section>

      <section className="section" id="costliest">
        <div className="section-header">
          <div>
            <div className="section-kicker">§ 02 · The Three Costliest</div>
            <h2 className="section-title">
              Where the conservative calls hurt the most
            </h2>
          </div>
        </div>
        <CostliestPlays
          plays={plays}
          selectedPlayId={selectedPlayId}
          onSelect={handleSelect}
        />
      </section>

      <section className="section" id="takeaway">
        <div className="section-header">
          <div>
            <div className="section-kicker">§ 03 · Takeaway</div>
            <h2 className="section-title">What this means for 2026</h2>
          </div>
        </div>
        <Takeaway plays={plays} summary={summary} />
      </section>

      <Methodology />
    </div>
  );
}
