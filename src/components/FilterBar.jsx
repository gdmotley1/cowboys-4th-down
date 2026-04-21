export default function FilterBar({ filter, counts, onChange }) {
  const tabs = [
    { id: "all", label: "All decisions", count: counts.all },
    { id: "misses", label: "Misses only", count: counts.misses },
    { id: "correct", label: "Correct", count: counts.correct },
  ];

  return (
    <div className="filter-bar" role="tablist" aria-label="Filter decisions">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={filter === t.id}
          className={`filter-btn${filter === t.id ? " active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          <span className="count num">{t.count}</span>
        </button>
      ))}
    </div>
  );
}
