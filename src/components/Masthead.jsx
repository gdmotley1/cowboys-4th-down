export default function Masthead({ summary }) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="mark">
          <svg className="mark-star" viewBox="0 0 100 100" aria-hidden="true">
            <polygon
              points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"
              fill="#ffffff"
            />
          </svg>
          <span className="mark-title">Cowboys Fourth-Down Intelligence</span>
          <span className="mark-sub">2025 Regular Season</span>
        </div>
        <div className="masthead-right">
          <span>
            <strong className="num">{summary.total_plays}</strong> decisions
          </span>
          <span>
            <strong className="num">{summary.incorrect_count}</strong> missed
          </span>
          <span>Prepared by Grant Motley</span>
        </div>
      </div>
    </header>
  );
}
