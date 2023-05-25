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
        path: path.join(configHLS["--directory-prefix"], 'video', 'segment_0.ts')
      },
      audio: {
        path: path.join(configHLS["--directory-prefix"], 'audio', 'stream_0', 'segment_0.aac')
      }
    }
    media.video.found = fs.existsSync(media.video.path)
    media.audio.found = fs.existsSync(media.audio.path)

    if (!media.video.found || !media.audio.found) {
      reject(new Error('ffmpeg error: media file not found'))
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

module.exports = {
  catch_ffmpeg_conversion_error,
  run_fallback_ffmpeg_video_conversion
}
