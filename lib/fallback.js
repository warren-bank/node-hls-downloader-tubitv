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
      video: {},
      audio: {}
    }

    try {
      find_media_video(configHLS, media.video)
      find_media_audio(configHLS, media.audio)
    }
    catch(e) {
      reject(e)
      return
    }

    console.log("starting fallback ffmpeg conversion to mp4 file..")

    const log = '-nostats -hide_banner -loglevel panic'
    const cmd = `ffmpeg ${log} -i "${media.video.path}" -i "${media.audio.path}" -c copy -movflags +faststart ${configHLS["--mp4-ffmpeg-options"] || ''} "${configHLS["--mp4"]}"`
    const opt = {cwd: configHLS["--directory-prefix"]}
    spawn(cmd, opt, (error, stdout, stderr) => {
      if (error) {
        console.log("ffmpeg error:")

        reject(error)
      }
      else {
        console.log("done")
        console.log("")

        resolve(results)
      }
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
  const default_streams = ['stream_0', 'english']

  for (let stream of default_streams) {
    audio.path  = path.join(configHLS["--directory-prefix"], 'audio', stream, 'segment_0.aac')
    audio.found = fs.existsSync(audio.path)

    if (audio.found) break
  }

  if (!audio.found)
    search_media_audio(configHLS, audio)

  if (!audio.found)
    throw new Error('ffmpeg error: audio media file not found')
}

const search_media_audio = function(configHLS, audio) {
  const audio_dir = path.join(configHLS["--directory-prefix"], 'audio')
  if (!fs.existsSync(audio_dir)) return

  const stream_entries = fs.readdirSync(audio_dir, {withFileTypes: true})
  for (let stream_entry of stream_entries) {
    if (audio.found) break

    if (stream_entry.isDirectory()) {
      const stream_dir = path.join(audio_dir, stream_entry.name)

      const segment_entries = fs.readdirSync(stream_dir, {withFileTypes: true})
      for (let segment_entry of segment_entries) {
        if (audio.found) break

        if (segment_entry.isFile() && segment_entry.name.endsWith('.aac')) {
          audio.path  = path.join(stream_dir, segment_entry.name)
          audio.found = fs.existsSync(audio.path)
        }
      }
    }
  }
}

module.exports = {
  catch_ffmpeg_conversion_error,
  run_fallback_ffmpeg_video_conversion
}
