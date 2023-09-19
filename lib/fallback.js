const path  = require('path')
const fs    = require('fs')
const spawn = require('child_process').exec

const catch_ffmpeg_conversion_error = function(error) {
  // rethrow error if it didn't come from ffmpeg
  if (!error.cmd || (error.cmd.indexOf('ffmpeg') !== 0))
    throw error
}

const run_fallback_ffmpeg_video_conversion = function(configHLS, results){
  return new Promise((resolve, reject) => {
    if (!configHLS["--mp4"]) {
      resolve(results)
      return
    }

    if (fs.existsSync(configHLS["--mp4"])) {
      resolve(results)
      return
    }

    const media = {
      video: {
        path:  null,
        found: false
      },
      audio: {
        paths:   [],
        names:   [],
        default: 0,
        found:   false
      }
    }

    try {
      find_media_video(configHLS, media.video)
      find_media_audio(configHLS, media.audio)
    }
    catch(error) {
      reject(error)
      return
    }

    console.log("starting fallback ffmpeg conversion to mp4 file..")

    perform_fallback_ffmpeg_video_conversion(configHLS, media)
    .then(() => {
      console.log("done")
      console.log("")

      resolve(results)
    })
    .catch((error) => {
      console.log("ffmpeg error:")

      reject(error)
    })
  })
}

const find_media_video = function(configHLS, video) {
  video.path  = path.join(configHLS["--directory-prefix"], 'video', 'segment_0.ts')
  video.found = fs.existsSync(video.path)

  if (!video.found)
    throw new Error('ffmpeg error: video media file not found')
}

const find_media_audio = function(configHLS, audio) {
  search_media_audio(configHLS, audio)

  if (!audio.found)
    throw new Error('ffmpeg error: audio media file not found')

  if (audio.names.length > 1) {
    const default_streams = ['stream_0', 'english']

    for (let stream of default_streams) {
      const stream_index = audio.names.indexOf(stream)

      if (stream_index >= 0) {
        audio.default = stream_index
        break
      }
    }
  }
}

const search_media_audio = function(configHLS, audio) {
  const audio_dir = path.join(configHLS["--directory-prefix"], 'audio')
  if (!fs.existsSync(audio_dir)) return

  const stream_entries = fs.readdirSync(audio_dir, {withFileTypes: true})
  for (let stream_entry of stream_entries) {
    if (stream_entry.isDirectory()) {
      const audio_path  = path.join(audio_dir, stream_entry.name, 'segment_0.aac')
      const audio_found = fs.existsSync(audio_path)

      if (audio_found) {
        audio.paths.push(audio_path)
        audio.names.push(stream_entry.name)
        audio.found = true
      }
    }
  }
}

const perform_fallback_ffmpeg_video_conversion = function(configHLS, media){
  if (media.audio.paths.length === 1) {
    return perform_fallback_ffmpeg_video_conversion_with_one_audio_stream(configHLS, media)
  }
  else if (media.audio.paths.length > 1) {
    return perform_fallback_ffmpeg_video_conversion_with_multiple_audio_streams(configHLS, media)
    .catch(() => perform_fallback_ffmpeg_video_conversion_with_one_audio_stream(configHLS, media))
  }
}

const perform_fallback_ffmpeg_video_conversion_with_one_audio_stream = function(configHLS, media){
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-nostats -hide_banner -loglevel panic',
      `-i "${media.video.path}"`,
      `-i "${media.audio.paths[media.audio.default]}"`,
      '-c copy',
      '-movflags +faststart',
      configHLS["--mp4-ffmpeg-options"],
      qq(configHLS["--mp4"])
    ].join(' ')

    const opt = {cwd: configHLS["--directory-prefix"]}

    spawn(cmd, opt, (error, stdout, stderr) => {
      if (error)
        reject(error)
      else
        resolve()
    })
  })
}

const perform_fallback_ffmpeg_video_conversion_with_multiple_audio_streams = function(configHLS, media){
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-nostats -hide_banner -loglevel panic',
      `-i "${media.video.path}"`,
      ...media.audio.paths.map((path, index) => `-i "${path}"`),
      '-map "0:v"',
      ...media.audio.paths.map((path, index) => `-map "${index + 1}:a"`),
      '-c copy',
      '-movflags +faststart',
      configHLS["--mp4-ffmpeg-options"],
      ...media.audio.names.map((name, index) => `-metadata:s:a:${index} title="${name}"`),
      ...media.audio.names.map((name, index) => `-metadata:s:a:${index} language="${normalize_language_name(name)}"`),
      `-disposition:a:${media.audio.default} default`,
      qq(configHLS["--mp4"])
    ].join(' ')

    const opt = {cwd: configHLS["--directory-prefix"]}

    spawn(cmd, opt, (error, stdout, stderr) => {
      if (error)
        reject(error)
      else
        resolve()
    })
  })
}

const qq = (text) => `"${text}"`

const normalize_language_name_regex = /^.*?([A-Za-z_-]+).*$/
const normalize_language_name = (name) => name.replace(normalize_language_name_regex, '$1')

module.exports = {
  catch_ffmpeg_conversion_error,
  run_fallback_ffmpeg_video_conversion
}
