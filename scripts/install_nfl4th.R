options(repos = c(CRAN = "https://cloud.r-project.org"))
userlib <- Sys.getenv("R_LIBS_USER")
if (nzchar(userlib)) {
  dir.create(userlib, recursive = TRUE, showWarnings = FALSE)
  .libPaths(c(userlib, .libPaths()))
}
install_lib <- if (nzchar(userlib)) userlib else .libPaths()[1]

cat("Installing into:", install_lib, "\n")

install.packages(c("nfl4th", "nflreadr", "dplyr", "tidyr", "jsonlite"),
                 lib = install_lib, dependencies = TRUE, quiet = FALSE)

cat("\n=== Verify load ===\n")
library(nfl4th)
library(nflreadr)
cat("nfl4th version:", as.character(packageVersion("nfl4th")), "\n")
cat("nflreadr version:", as.character(packageVersion("nflreadr")), "\n")
cat("DONE\n")
