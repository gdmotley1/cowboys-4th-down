import Header from "./components/Header.jsx";
import StatCards from "./components/StatCards.jsx";
import DecisionMap from "./components/DecisionMap.jsx";
import Takeaway from "./components/Takeaway.jsx";

import plays from "./data/fourth_down_data.json";
import summary from "./data/summary_stats.json";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <StatCards summary={summary} />
        <DecisionMap plays={plays} />
        <Takeaway plays={plays} summary={summary} />
      </main>
      <footer className="footer">
        <span>Built by Grant Motley · Data: nflfastR + nfl4th (Ben Baldwin)</span>
      </footer>
    </div>
  );
}
