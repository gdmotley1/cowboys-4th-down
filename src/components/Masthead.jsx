export default function Masthead() {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <svg
          className="masthead-star"
          viewBox="0 0 100 100"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"
            fill="#ffffff"
          />
        </svg>
        <div className="masthead-id">
          Strategic&nbsp;Decisions&nbsp;Briefing · Vol.&nbsp;01
        </div>
        <div className="masthead-meta">
          <span>Dallas Cowboys</span>
          <span className="sep">·</span>
          <span>2025 Regular Season</span>
          <span className="sep">·</span>
          <span>April 2026</span>
        </div>
      </div>
    </header>
  );
}
