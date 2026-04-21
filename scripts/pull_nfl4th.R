# Pulls 2025 NFL pbp, filters to DAL 4th-down plays, runs nfl4th::add_4th_probs
# to compute go_boost / go_wp / fg_wp / punt_wp etc., writes CSV for the
# Python pipeline to consume.

suppressPackageStartupMessages({
  userlib <- Sys.getenv("R_LIBS_USER")
  .libPaths(c(userlib, .libPaths()))
  library(nflreadr)
  library(nfl4th)
  library(dplyr)
})

out_dir <- "C:/Users/motle/claude-code/cowboys-4th-down/data"
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

cat("Loading 2025 NFL pbp...\n")
pbp <- nflreadr::load_pbp(2025)
cat("  rows:", nrow(pbp), "\n")

cat("Filtering to DAL 4th-down, REG season...\n")
dal_4th <- pbp |>
  dplyr::filter(
    posteam == "DAL",
    down == 4,
    season_type == "REG",
    !is.na(posteam)
  )
cat("  DAL 4th-down REG plays:", nrow(dal_4th), "\n")

cat("Running nfl4th::add_4th_probs (computes go_boost / go_wp / fg_wp / punt_wp)...\n")
dal_probs <- nfl4th::add_4th_probs(dal_4th)
cat("  got probs for:", nrow(dal_probs), "plays\n")

# Columns we need in the Python pipeline
keep_cols <- c(
  "game_id", "play_id", "week", "qtr",
  "ydstogo", "yardline_100", "play_type", "desc",
  "ep", "epa", "wp",
  "fourth_down_converted", "fourth_down_failed",
  "score_differential", "posteam_score", "defteam_score",
  "game_seconds_remaining",
  "home_team", "away_team", "posteam", "defteam",
  # nfl4th output columns
  "go_boost", "go_wp", "fg_wp", "punt_wp",
  "first_down_prob", "fg_make_prob",
  "wp_fail", "wp_succeed"
)

missing <- setdiff(keep_cols, names(dal_probs))
if (length(missing) > 0) {
  stop("Missing expected columns: ", paste(missing, collapse = ", "))
}

out <- dal_probs |> dplyr::select(dplyr::all_of(keep_cols))

csv_path <- file.path(out_dir, "dal_4th_raw.csv")
write.csv(out, csv_path, row.names = FALSE, na = "")
cat("\nWrote:", csv_path, "\n")
cat("Rows:", nrow(out), "Cols:", ncol(out), "\n")

cat("\n=== Sanity check: go_boost summary ===\n")
gb <- out$go_boost
cat("non-na go_boost:", sum(!is.na(gb)), "/", length(gb), "\n")
cat("range:", round(range(gb, na.rm = TRUE), 2), "\n")
cat("mean:", round(mean(gb, na.rm = TRUE), 2), "\n")

cat("\n=== play_type breakdown ===\n")
print(table(out$play_type, useNA = "ifany"))

cat("\nDONE\n")
