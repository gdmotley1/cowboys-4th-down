import { useMemo } from "react";
import {
  isConservativeMiss,
  sortByCostDesc,
  sumPositiveGoBoost,
} from "../lib/decisionFilters.js";

function fieldPos(play) {
  const y = play.yardline_100;
  if (y === 50) return "midfield";
  if (y < 50) return `opp ${y}`;
  return `own ${100 - y}`;
}

function matchup(play) {
  return `Week ${play.week} ${play.posteam === play.home_team ? "vs" : "at"} ${play.defteam}`;
}

export default function KpiHeadline({ summary, plays }) {
  const story = useMemo(() => {
    const conservative = plays.filter(isConservativeMiss).sort(sortByCostDesc);
    const shortYardageNoGos = conservative.filter((p) => p.ydstogo <= 3);
    const midfieldNoGos = conservative.filter(
      (p) => p.yardline_100 >= 40 && p.yardline_100 <= 60
    );
    return {
      conservative,
      shortYardageNoGos,
      midfieldNoGos,
      worstConservative: conservative[0],
      shortYardageCost: sumPositiveGoBoost(shortYardageNoGos),
      midfieldCost: sumPositiveGoBoost(midfieldNoGos),
    };
  }, [plays]);

  const expectedWins = (summary.wp_left_on_table / 100).toFixed(2);

  return (
    <section className="storyline" aria-label="Season story">
      <article className="story-card story-card-primary">
        <div className="story-label">Main finding</div>
        <div className="story-value-row">
          <span className="story-value num">{summary.wp_left_on_table.toFixed(1)}</span>
          <span className="story-unit">WP pts</span>
        </div>
        <p>
          Conservative fourth-down calls surrendered roughly{" "}
          <strong className="num">{expectedWins}</strong> expected wins.
        </p>
      </article>

      <article className="story-card">
        <div className="story-label">Miss profile</div>
        <div className="story-value-row">
          <span className="story-value num">{story.conservative.length}</span>
          <span className="story-unit">no-gos</span>
        </div>
        <p>
          {story.shortYardageNoGos.length} came on 4th-and-3 or shorter, worth{" "}
          <strong className="num">{story.shortYardageCost.toFixed(1)}</strong> WP pts.
        </p>
      </article>

      <article className="story-card">
        <div className="story-label">Field-position band</div>
        <div className="story-value-row">
          <span className="story-value num">{story.midfieldNoGos.length}</span>
          <span className="story-unit">near midfield</span>
        </div>
        <p>
          Own 40 through opponent 40 accounted for{" "}
          <strong className="num">{story.midfieldCost.toFixed(1)}</strong> WP pts.
        </p>
      </article>

      {story.worstConservative && (
        <article className="story-card">
          <div className="story-label">Sharpest single miss</div>
          <div className="story-value-row">
            <span className="story-value num">
              +{story.worstConservative.go_boost.toFixed(2)}
            </span>
            <span className="story-unit">WP</span>
          </div>
          <p>
            {matchup(story.worstConservative)} - 4th &amp;{" "}
            {story.worstConservative.ydstogo} at {fieldPos(story.worstConservative)}.
          </p>
        </article>
      )}
    </section>
  );
}
