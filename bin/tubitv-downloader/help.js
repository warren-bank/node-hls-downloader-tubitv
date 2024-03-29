const help = `
tubidl <options>

options:
========
"-h"
"--help"
    Print a help message describing all command-line options.

"-v"
"--version"
    Display the version.

"-q"
"--quiet"
    Do not print a verbose log of operations.

"-ll" <integer>
"--log-level" <integer>
    Specify the log verbosity level.
      0 = no output (same as --quiet)
      1 = include only episode TubiTV URLs
      2 = include only episode ffmpeg commands
      3 = include all operational metadata (default)

"-dr"
"--dry-run"
    Do not write to the file system.

"-nm"
"--no-mp4"
    Do not use "ffmpeg" to bundle the downloaded video stream into an .mp4 file container.

"-mf" <integer>
"--mp4-filename" <integer>
    Specify the numeric mode used to configure the filename of the .mp4 file container.
      0 = "video.mp4" (default)
      1 = "\${movie-or-episode-title}.mp4"
      2 = "\${movie-title}.mp4" or "\${series-title} - \${episode-title}.mp4"

"-mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.

"-P" <dirpath>
"--directory-prefix" <dirpath>
    Specifies the directory where the resulting file structure will be saved to.
    The default is "." (the current directory).

"-u" <URL>
"--url" <URL>
    Specify a TubiTV URL. (movie, episode, or series)

"-i <filepath>"
"--input-file <filepath>"
    Read TubiTV URLs from a local text file. Format is one URL per line.
`

module.exports = help
