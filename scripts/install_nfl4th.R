options(repos = c(CRAN = "https://cloud.r-project.org"))
userlib <- Sys.getenv("R_LIBS_USER")
dir.create(userlib, recursive = TRUE, showWarnings = FALSE)
.libPaths(c(userlib, .libPaths()))

cat("Installing into:", userlib, "\n")

install.packages(c("nfl4th", "nflreadr", "dplyr", "tidyr", "jsonlite"),
                 lib = userlib, dependencies = TRUE, quiet = FALSE)

cat("\n=== Verify load ===\n")
library(nfl4th)
library(nflreadr)
cat("nfl4th version:", as.character(packageVersion("nfl4th")), "\n")
cat("nflreadr version:", as.character(packageVersion("nflreadr")), "\n")
cat("DONE\n")
