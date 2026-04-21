export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <svg
          className="star"
          viewBox="0 0 100 100"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"
            fill="#ffffff"
            stroke="#869397"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <h1 className="title">Cowboys 2025 Fourth Down Intelligence</h1>
          <p className="subtitle">Decision Analysis — Regular Season</p>
        </div>
        <div className="meta">
          <div>
            <strong>Built by Grant Motley</strong>
          </div>
          <div>Data: nflfastR + nfl4th</div>
        </div>
      </div>
    </header>
  );
}
