const {requestHTTP, downloadHTTP, downloadHLS} = require('@warren-bank/node-hls-downloader')

const mkdir = require('./mkdir')
const path  = require('path')
const fs    = require('fs')

// -----------------------------------------------------------------------------
// returns a Promise that resolves after all downloads are complete.

const process_cli = function(argv_vals){

  const download_file = async function(url){
    let file
    try {
      file = await requestHTTP(url)
      file = file.response.toString()
    }
    catch(err) {
      file = ""
    }
    return file
  }

  // ---------------------------------------------------------------------------

  const regex_url_type = /^https?:\/\/(?:[^\.]+\.)*tubitv\.com\/(movies|tv-shows|series)\/\d+(?:\/.+)?$/i

  const get_url_type = function(url){
    const matches = regex_url_type.exec(url)
    let type

    if (!matches)
      throw new Error(`Error: cannot parse format of TubiTV URL: '${url}'`)

    switch(matches[1].toLowerCase()) {
      case 'movies':
        type = 'movie'
        break
      case 'tv-shows':
        type = 'episode'
        break
      case 'series':
        type = 'series'
        break
    }

    if (!type)
      throw new Error(`Error: unrecognized page type '${matches[1]}' in TubiTV URL: '${url}'`)

    return type
  }

  const process_url = async function(url, type){
    if (!type)
      type = get_url_type(url)

    const html = await download_file(url)
    if (!html) throw new Error(`Error: empty server response at URL: '${url}'`)

    await process_html(html, type, url)
  }

  // ---------------------------------------------------------------------------

  const regex_html_json = /^.*>window.__data=({.*?});<.*$/i

  const process_html = async function(html, type, url){
    let matches, json, data

    html = html.replace(/[\r\n]+/g, ' ')

    matches = regex_html_json.exec(html)
    if (!matches) throw new Error(`Error: no ${type} video stream found in server response at URL: '${url}'`)

    json = matches[1]

    // fix JSON
    json = json.replace(/(":)undefined([,}\]])/g, '$1null$2')

    try {
      data = JSON.parse(json)
    }
    catch(err) {
      throw new Error(`Error: parsing JSON metadata for ${type} video stream in server response at URL: '${url}'`)
    }

    if (!data || !(data instanceof Object))
      throw new Error(`Error: non-object metadata for ${type} video stream in server response at URL: '${url}'`)

    html    = null
    matches = null
    json    = null

    switch(type) {
      case 'movie':
      case 'episode':
        await process_video_data(data, type, url)
        break
      case 'series':
        await process_series_data(data, type, url)
        break
    }
  }

  // ---------------------------------------------------------------------------
  // returns a Promise that resolves after all downloads complete (HLS video, HLS audio, VTT subtitles, SRT subtitles) for a single movie or TV episode

  const process_video_data = function(data, type, url){
    const keys   = Object.keys(data.video.statusById)
    const videos = keys.map(key => data.video.byId[key])

    let subtitles

    const configHLS = {
      "--no-clobber":        false,
      "--continue":          true,
    
      "--url":               null,
      "--max-concurrency":   argv_vals["--max-concurrency"],
    
      "--directory-prefix":  null,
      "--mp4":               null,
    
      "--skip-video":        false,
      "--skip-audio":        false,
      "--skip-subtitles":    false,
    
      "--min-bandwidth":     null,
      "--max-bandwidth":     null,
      "--highest-quality":   true,
      "--lowest-quality":    false,
    
      "--all-audio":         true,
      "--all-subtitles":     true,
      "--filter-audio":      null,
      "--filter-subtitles":  null
    }

    const configHTTP = {
      "--input-file":        null,
      "--directory-prefix":  null,
      "--no-clobber":        true,
      "--max-concurrency":   argv_vals["--max-concurrency"]
    }

    if (type === 'movie') {
      // assertion
      if (videos.length !== 1)
        throw new Error(`Assertion Error: unexpected video object count in metadata for ${type} video stream in server response at URL: '${url}'`)

      let video_stream = videos[0]

      if (!video_stream.url || !video_stream.title)
        throw new Error(`Assertion Error: missing data fields in video object metadata for ${type} video stream in server response at URL: '${url}'`)

      configHLS["--url"]               = video_stream.url
      configHLS["--directory-prefix"]  = path.join(argv_vals["--directory-prefix"], sanitize_title(video_stream.title), 'hls')

      if (!argv_vals["--no-mp4"]) {
        configHLS["--mp4"]             = path.join(argv_vals["--directory-prefix"], sanitize_title(video_stream.title), 'mp4')
      }

      configHTTP["--directory-prefix"] = path.join(argv_vals["--directory-prefix"], sanitize_title(video_stream.title), 'mp4')

      subtitles = video_stream.subtitles
    }

    if (type === 'episode') {
      // assertion
      if (videos.length !== 2)
        throw new Error(`Assertion Error: unexpected video object count in metadata for ${type} video stream in server response at URL: '${url}'`)

      let video_stream, video_series

      video_stream = videos.filter(video => (video.url && video.title))
      if (video_stream.length !== 1)
        throw new Error(`Assertion Error: missing data fields in video object metadata for ${type} video stream in server response at URL: '${url}'`)
      video_stream = video_stream[0]

      video_series = videos.filter(video => (video !== video_stream))
      if (video_series.length !== 1)
        throw new Error(`Assertion Error: missing data fields in video object metadata for ${type} video stream in server response at URL: '${url}'`)
      video_series = video_series[0]

      if (!video_series.title)
        throw new Error(`Assertion Error: missing data fields in video object metadata for ${type} video stream in server response at URL: '${url}'`)

      configHLS["--url"]               = video_stream.url
      configHLS["--directory-prefix"]  = path.join(argv_vals["--directory-prefix"], sanitize_title(video_series.title), sanitize_title(video_stream.title), 'hls')

      if (!argv_vals["--no-mp4"]) {
        configHLS["--mp4"]             = path.join(argv_vals["--directory-prefix"], sanitize_title(video_series.title), sanitize_title(video_stream.title), 'mp4')
      }

      configHTTP["--directory-prefix"] = path.join(argv_vals["--directory-prefix"], sanitize_title(video_series.title), sanitize_title(video_stream.title), 'mp4')

      subtitles = video_stream.subtitles
    }

    if (!argv_vals["--quiet"]) {
      let outputdir = path.dirname(configHLS["--directory-prefix"])
      let ffmpegcmd = `cd "${configHLS["--directory-prefix"]}" && mkdir "${path.join('..', 'mp4')}" & ffmpeg -allowed_extensions ALL -i "master.m3u8" -c copy -movflags +faststart "${path.join('..', 'mp4', 'video.mp4')}"`

      switch(argv_vals["--log-level"]) {
        case 1:
          if (type === 'episode')
            console.log(url)
          break
        case 2:
          if (type === 'episode')
            console.log(ffmpegcmd)
          break
        case 3:
          console.log(`processing page:\n  ${url}\ntype:\n  ${type}\nHLS manifest:\n  ${configHLS["--url"]}\noutput directory:\n  ${outputdir}\nmp4 conversion${argv_vals["--no-mp4"] ? ' (skipped)' : ''}:\n  ${ffmpegcmd}`)
          break
        case 0:
        default:
          // noop
          break
      }
    }

    if (argv_vals["--dry-run"]) {
      return Promise.resolve()
    }
    else {
      const promises = []
      let promise

      promise = start_downloadHLS(configHLS)
      promises.push(promise)

      if (subtitles && subtitles.length) {
        subtitles = subtitles.filter(obj => (obj.url && obj.lang))
      }

      if (subtitles && subtitles.length) {
        configHTTP["--input-file"] = subtitles.map(obj => `${obj.url}\tvideo.${obj.lang.toLowerCase()}.srt`)

        promise = start_downloadHTTP(configHTTP)
        promises.push(promise)
      }

      return Promise.all(promises)
    }
  }

  const sanitize_title = (title) => title.replace(/[\\\/\*\?:"<>|]+/g, '')

  const start_downloadHLS = (configHLS) => {
    if (configHLS["--directory-prefix"]) {
      mkdir(configHLS["--directory-prefix"])

      // files
      ;["master.m3u8","video.m3u8"].forEach(child => {
        let childpath = path.join(configHLS["--directory-prefix"], child)
        if (fs.existsSync(childpath))
          fs.unlinkSync(childpath)
      })
    }

    if (configHLS["--mp4"]) {
      mkdir(configHLS["--mp4"])

      configHLS["--mp4"] = path.join(configHLS["--mp4"], 'video.mp4')

      if (fs.existsSync(configHLS["--mp4"]))
        fs.unlinkSync(configHLS["--mp4"])
    }

    // Promise
    return downloadHLS(configHLS)
  }

  const start_downloadHTTP = (configHTTP) => {
    if (configHTTP["--directory-prefix"])
      mkdir(configHTTP["--directory-prefix"])

    // Promise
    return downloadHTTP(configHTTP)
  }

  // ---------------------------------------------------------------------------
  // returns a Promise that resolves after all downloads complete for all episodes in all seasons of a series

  const process_series_data = async function(data, type, url){
    const keys   = Object.keys(data.video.statusById)
    const videos = keys.map(key => data.video.byId[key])

    if (type === 'series') {
      // assertion
      if (videos.length !== 1)
        throw new Error(`Assertion Error: unexpected video object count in metadata for ${type} video stream in server response at URL: '${url}'`)

      let video_series = videos[0]

      if (!video_series.seasons || !video_series.seasons.length)
        throw new Error(`Assertion Error: missing data fields in video object metadata for ${type} video stream in server response at URL: '${url}'`)

      let episodes = []

      video_series.seasons.forEach(season => {
        if (season.episodeIds && season.episodeIds.length) {
          episodes = [
            ...episodes,
            ...season.episodeIds.map(id => `https://tubitv.com/tv-shows/${id}`)
          ]
        }
      })

      while(episodes.length) {
        let url  = episodes.shift()
        let type = 'episode'
        await process_url(url, type)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // returns a Promise that resolves after all URLs in command-line have been processed

  const process_argv = async function(){
    if (argv_vals["--input-file"] && argv_vals["--input-file"].length) {
      while(argv_vals["--input-file"].length) {
        let url = argv_vals["--input-file"].shift()
        await process_url(url)
      }
    }
    else {
      let url = argv_vals["--url"]
      await process_url(url)
    }
  }

  return process_argv()
}

// -----------------------------------------------------------------------------

module.exports = {requestHTTP, downloadHTTP, downloadHLS, downloadTV: process_cli}
