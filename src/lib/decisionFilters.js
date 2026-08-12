export const DECISION_VIEWS = [
  { key: "misses", label: "Misses", short: "Missed calls" },
  { key: "conservative", label: "Conservative", short: "Kick/punt instead of go" },
  { key: "aggressive", label: "Aggressive", short: "Go instead of kick/punt" },
  { key: "matched", label: "Matched", short: "Model-aligned calls" },
  { key: "all", label: "All", short: "Every charted play" },
];

export function playKey(play) {
  return `${play.game_id}::${play.play_id}`;
}

export function isScoredDecision(play) {
  return play.correct === true || play.correct === false;
}

export function isMiss(play) {
  return play.correct === false && play.go_boost != null;
}

export function isConservativeMiss(play) {
  return isMiss(play) && play.go_boost > 0 && play.decision !== "went_for_it";
}

export function isAggressiveMiss(play) {
  return isMiss(play) && play.go_boost <= 0 && play.decision === "went_for_it";
}

export function isVisibleForView(play, view) {
  if (view === "misses") return isMiss(play);
  if (view === "conservative") return isConservativeMiss(play);
  if (view === "aggressive") return isAggressiveMiss(play);
  if (view === "matched") return play.correct === true;
  return true;
}

export function getViewCounts(plays) {
  return DECISION_VIEWS.reduce((counts, view) => {
    counts[view.key] = plays.filter((play) => isVisibleForView(play, view.key)).length;
    return counts;
  }, {});
}

export function costAbs(play) {
  return Math.abs(play.go_boost ?? 0);
}

export function sortByCostDesc(a, b) {
  return costAbs(b) - costAbs(a);
}

export function sumPositiveGoBoost(plays) {
  return plays.reduce((total, play) => total + Math.max(0, play.go_boost ?? 0), 0);
}
