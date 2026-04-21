import { Fragment, useMemo } from "react";

/**
 * 5x6 decision heatmap: yards-to-go buckets × field-position zones.
 * Each cell aggregates plays in that situation and shows total WP cost of
 * decisions that didn't match the model.
 */

const ZONES = [
  { key: "own_deep", label: "OWN 1-20", range: [81, 99] },
  { key: "own_mid",  label: "OWN 20-40", range: [61, 80] },
  { key: "own_fl",   label: "OWN 40–50", range: [50, 60] },
  { key: "opp_fl",   label: "50–OPP 40", range: [40, 49] },
  { key: "opp_fg",   label: "OPP 40-21", range: [21, 39] },
  { key: "opp_rz",   label: "OPP 20-GL", range: [1, 20] },
];

const ROWS = [
  { key: "d1",  label: "1 YD",    test: (y) => y === 1 },
  { key: "d23", label: "2–3 YD",  test: (y) => y >= 2 && y <= 3 },
  { key: "d46", label: "4–6 YD",  test: (y) => y >= 4 && y <= 6 },
  { key: "d710", label: "7–10 YD", test: (y) => y >= 7 && y <= 10 },
  { key: "d11",  label: "11+ YD",  test: (y) => y >= 11 },
];

function inZone(yl, range) {
  return yl >= range[0] && yl <= range[1];
}

export default function DecisionGrid({
  plays,
  selectedCellKey,
  onCellSelect,
}) {
  const cells = useMemo(() => {
    const out = {};
    let maxCost = 0;
    for (const row of ROWS) {
      for (const zone of ZONES) {
        const key = `${row.key}::${zone.key}`;
        const matched = plays.filter(
          (p) => row.test(p.ydstogo) && inZone(p.yardline_100, zone.range)
        );
        const misses = matched.filter(
          (p) => p.correct === false && p.go_boost != null
        );
        const cost = misses.reduce((s, p) => s + Math.abs(p.go_boost), 0);
        if (cost > maxCost) maxCost = cost;
        out[key] = { matched, misses, cost };
      }
    }
    return { map: out, maxCost };
  }, [plays]);

  return (
    <div>
      <div
        className="grid-matrix"
        style={{
          gridTemplateColumns: `90px repeat(${ZONES.length}, 1fr)`,
        }}
      >
        {/* Top-left corner empty */}
        <div className="grid-axis-y" />
        {ZONES.map((z) => (
          <div key={z.key} className="grid-axis-x" title={z.label}>
            {z.label}
          </div>
        ))}

        {ROWS.map((row) => (
          <Fragment key={row.key}>
            <div className="grid-axis-y">{row.label}</div>
            {ZONES.map((zone) => {
              const key = `${row.key}::${zone.key}`;
              const cell = cells.map[key];
              const heat = cells.maxCost
                ? cell.cost / cells.maxCost
                : 0;
              const active = selectedCellKey === key;
              const empty = cell.matched.length === 0;
              const bg = heat > 0
                ? `rgba(255, 159, 10, ${0.08 + heat * 0.26})`
                : "rgba(255, 255, 255, 0.01)";
              return (
                <button
                  key={key}
                  className={
                    "grid-cell" +
                    (cell.cost > 0 ? " has-cost" : "") +
                    (active ? " active" : "") +
                    (empty ? " empty" : "")
                  }
                  style={{ background: bg }}
                  onClick={() => {
                    if (empty) return;
                    onCellSelect && onCellSelect(key, cell.matched);
                  }}
                  disabled={empty}
                  type="button"
                  title={`${cell.matched.length} plays in ${row.label} · ${zone.label}`}
                >
                  <div className="cell-count">
                    {empty ? "—" : cell.matched.length}
                  </div>
                  <div className="cell-cost">
                    {cell.cost > 0 ? `+${cell.cost.toFixed(1)} wp` : empty ? "" : "\u00a0"}
                  </div>
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
