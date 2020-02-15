### [TubiTV Downloader](https://github.com/warren-bank/node-hls-downloader-tubitv)

Command-line utility for downloading an offline copy of [TubiTV](https://tubitv.com/) HLS video streams.

#### Installation:

```bash
npm install --global @warren-bank/node-hls-downloader-tubitv
```

#### Features:

* accepts URLs that identify:
  - a single movie
  - a single episode contained in a series
  - an entire series
    * includes all episodes in every seasons
* downloads:
  - the highest available quality for each video stream
  - _.srt_ subtitles for all available languages
  - will continue upon restart after an abrupt interruption
* resulting file structure:
  ```bash
    |- {title_series}/
    |  |- {title_episode}/
    |  |  |- hls/
    |  |  |  |- video/
    |  |  |  |  |- *.ts
    |  |  |  |- audio/
    |  |  |  |  |- {language}/
    |  |  |  |  |  |- *.ts
    |  |  |  |  |- {language}.m3u8
    |  |  |  |- subtitles/
    |  |  |  |  |- {language}/
    |  |  |  |  |  |- *.vtt
    |  |  |  |  |- {language}.m3u8
    |  |  |  |- video.m3u8
    |  |  |  |- master.m3u8
    |  |  |- mp4/
    |  |  |  |- video.mp4
    |  |  |  |- video.{language}.srt
  ```

#### Usage:

```bash
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
```

#### Example:

* download a movie:
  ```bash
    tubidl -q -mc 5 -u 'https://tubitv.com/movies/465487/citizenfour'
  ```
* download an episode:
  ```bash
    tubidl -q -mc 5 -u 'https://tubitv.com/tv-shows/498780/s01_e02_the_grand_deception_part_2'
  ```
* download a series:
  ```bash
    tubidl -mc 5 -u 'https://tubitv.com/series/4068/the_greatest_american_hero'
  ```
* print a trace of the operations that would occur IF a series were to be downloaded:
  ```bash
    tubidl -dr -ll 1 -u 'https://tubitv.com/series/4068/the_greatest_american_hero'
    tubidl -dr -ll 2 -u 'https://tubitv.com/series/4068/the_greatest_american_hero'
    tubidl -dr -ll 3 -u 'https://tubitv.com/series/4068/the_greatest_american_hero'
  ```
* download a series (advanced):
  ```bash
    tubidl -dr -ll 1 -u 'https://tubitv.com/series/4068/the_greatest_american_hero' >'episode_urls.txt'
    tubidl -dr -ll 2 -u 'https://tubitv.com/series/4068/the_greatest_american_hero' >'convert_mp4s.sh'

    tubidl -nm -mc 5 -i 'episode_urls.txt' >'log.txt' 2>&1

    ./convert_mp4s.sh
  ```

##### suggestions:

1. download with options: `--no-mp4 --log-level 3`
   * redirect stdout to a log file
   * when download completes, check the log file for any error messages
   * if any _.ts_ chunks encountered a download problem
     - identify the url of the TubiTV page that was being processed when this error occurred
     - redownload that page (using the same `--directory-prefix`)
       * all previously downloaded data __not__ be modified or deleted
       * only missing data will be retrieved
2. repeat the above process until the log file shows no download errors
3. finally, convert the HLS stream to mp4
   * the `ffmpeg` command to perform this conversion is included in the log file
   * when converting the episodes in a series, a list of all `ffmpeg` commands can be generated with the options: `--dry-run --log-level 2`

#### Requirements:

* Node version: v6.13.0 (and higher)
  * [ES6 support](http://node.green/)
    * v0.12.18+: Promise
    * v4.08.03+: Object shorthand methods
    * v5.12.00+: spread operator
    * v6.04.00+: Proxy constructor
    * v6.04.00+: Proxy 'apply' handler
    * v6.04.00+: Reflect.apply
  * [URL](https://nodejs.org/api/url.html)
    * v6.13.00+: [Browser-compatible URL class](https://nodejs.org/api/url.html#url_class_url)
  * tested in:
    * v7.9.0
* FFmpeg
  * not required in `PATH` when using the `--no-mp4` CLI option
  * successfully tested with version: _4.1.3_

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
