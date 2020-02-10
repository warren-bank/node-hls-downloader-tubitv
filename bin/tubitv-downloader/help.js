const help = `
tubidl <options>

options:
========
"-h"
"--help"
    Print a help message describing all command-line options.

"-V"
"--version"
    Display the version.

"-u" <URL>
"--url" <URL>
    Specify the URL of master manifest.

"-nm"
"--no-mp4"
    Do not use "ffmpeg" to bundle the downloaded video stream into an .mp4 file container.

"-mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.

"-P" <dirpath>
"--directory-prefix" <dirpath>
    Specifies the directory where the resulting file structure will be saved to.
    The default is "." (the current directory).
`

module.exports = help
