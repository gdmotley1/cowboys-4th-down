import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const playsPath = path.join(root, "src", "data", "fourth_down_data.json");
const summaryPath = path.join(root, "src", "data", "summary_stats.json");

const plays = JSON.parse(fs.readFileSync(playsPath, "utf8"));
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function near(a, b, epsilon = 0.00001) {
  return Math.abs(a - b) <= epsilon;
}

function playKey(play) {
  return `${play.game_id}::${play.play_id}`;
}

const requiredSummary = [
  "total_decisions",
  "correct_count",
  "incorrect_count",
  "correct_pct",
  "wp_left_on_table",
  "went_for_it_count",
  "went_for_it_converted",
  "went_for_it_failed",
  "punted_count",
  "field_goal_count",
  "total_plays",
  "unscorable_plays",
  "season",
  "team",
];

for (const key of requiredSummary) {
  assert(Object.hasOwn(summary, key), `summary_stats.json missing ${key}`);
}

assert(Array.isArray(plays), "fourth_down_data.json must be an array");
assert(plays.length > 0, "fourth_down_data.json is empty");

const keys = new Set(plays.map(playKey));
assert(keys.size === plays.length, "game_id::play_id keys must be unique");

const strategicDecisions = new Set(["went_for_it", "punted", "field_goal"]);
const scored = plays.filter(
  (play) => play.go_boost != null && strategicDecisions.has(play.decision)
);
const correct = scored.filter((play) => play.correct === true);
const incorrect = scored.filter((play) => play.correct === false);
const conservativeMisses = scored.filter(
  (play) => play.go_boost > 0 && play.decision !== "went_for_it"
);
const wentForIt = plays.filter((play) => play.decision === "went_for_it");
const punted = plays.filter((play) => play.decision === "punted");
const fieldGoals = plays.filter((play) => play.decision === "field_goal");

assert(summary.total_plays === plays.length, "summary.total_plays does not match play count");
assert(summary.total_decisions === scored.length, "summary.total_decisions does not match scored decisions");
assert(summary.correct_count === correct.length, "summary.correct_count does not match scored data");
assert(summary.incorrect_count === incorrect.length, "summary.incorrect_count does not match scored data");
assert(
  summary.unscorable_plays === plays.length - scored.length,
  "summary.unscorable_plays does not match scored gap"
);
assert(
  near(summary.correct_pct, round2(correct.length / scored.length * 100) / 100) ||
    near(summary.correct_pct, round2(correct.length / scored.length)),
  "summary.correct_pct does not match scored data"
);
assert(
  summary.wp_left_on_table === round2(conservativeMisses.reduce((sum, play) => sum + play.go_boost, 0)),
  "summary.wp_left_on_table does not match conservative miss sum"
);
assert(summary.went_for_it_count === wentForIt.length, "summary.went_for_it_count mismatch");
assert(summary.punted_count === punted.length, "summary.punted_count mismatch");
assert(summary.field_goal_count === fieldGoals.length, "summary.field_goal_count mismatch");
assert(
  summary.went_for_it_converted === wentForIt.reduce((sum, play) => sum + Number(play.fourth_down_converted || 0), 0),
  "summary.went_for_it_converted mismatch"
);
assert(
  summary.went_for_it_failed === wentForIt.reduce((sum, play) => sum + Number(play.fourth_down_failed || 0), 0),
  "summary.went_for_it_failed mismatch"
);

for (const play of plays) {
  assert(Number.isInteger(play.week) && play.week >= 1, `${playKey(play)} has invalid week`);
  assert(Number.isInteger(play.ydstogo) && play.ydstogo >= 1, `${playKey(play)} has invalid ydstogo`);
  assert(
    Number.isInteger(play.yardline_100) && play.yardline_100 >= 1 && play.yardline_100 <= 99,
    `${playKey(play)} has invalid yardline_100`
  );
}

if (errors.length) {
  console.error("Data validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Data validation passed: ${plays.length} plays, ${scored.length} scored decisions, ${incorrect.length} misses.`
);
