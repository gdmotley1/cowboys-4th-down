export default function StatusBar({ summary }) {
  return (
    <div className="statusbar">
      <div className="statusbar-inner">
        <svg
          className="statusbar-star"
          viewBox="0 0 100 100"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"
            fill="#ffffff"
          />
        </svg>
        <span className="statusbar-live">FEED · LIVE</span>
        <span className="sep">│</span>
        <span>Dallas Cowboys</span>
        <span className="sep">│</span>
        <span>2025 Regular</span>
        <span className="sep">│</span>
        <span>4th-Down Decision Quality</span>
        <span className="sep">│</span>
        <span>nfl4th v1.0.7</span>
        <div className="statusbar-right">
          <span>Scored {summary.total_decisions} / {summary.total_plays}</span>
          <span className="sep">│</span>
          <span>Rev. Apr 2026</span>
        </div>
      </div>
    </div>
  );
}
