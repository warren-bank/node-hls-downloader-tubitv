const process_argv = require('@warren-bank/node-process-argv')

const path = require('path')
const fs   = require('fs')

const argv_flags = {
  "--help":                   {bool:  true},
  "--version":                {bool:  true},
  "--no-mp4":                 {bool:  true},
  "--max-concurrency":        {num:   "int"},
  "--directory-prefix":       {},
  "--url":                    {}
}

const argv_flag_aliases = {
  "--help":                   ["-h"],
  "--version":                ["-V"],
  "--no-mp4":                 ["-nm"],
  "--max-concurrency":        ["-mc", "--threads"],
  "--directory-prefix":       ["-P"],
  "--url":                    ["-u"]
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  const data = require('../../package.json')
  console.log(data.version)
  process.exit(0)
}

if (typeof argv_vals["--max-concurrency"] === 'number') {
  if (argv_vals["--max-concurrency"] < 2) {
    argv_vals["--max-concurrency"] = 1
  }
}

if (!argv_vals["--directory-prefix"]) {
  argv_vals["--directory-prefix"] = process.cwd()
}

if (argv_vals["--directory-prefix"]) {
  argv_vals["--directory-prefix"] = path.resolve(argv_vals["--directory-prefix"])

  if (! fs.existsSync(argv_vals["--directory-prefix"])) {
    console.log('ERROR: Output directory does not exist')
    process.exit(0)
  }
}

if (!argv_vals["--url"]) {
  console.log('ERROR: TubiTV URL is required')
  process.exit(0)
}

{
  const url_pattern = /^https?:\/\/(?:[^\.]+\.)*tubitv\.com\/(movies|tv-shows|series)\/\d+(?:\/.+)?$/i
  const matches     = url_pattern.exec(argv_vals["--url"])

  if (!matches) {
    console.log('ERROR: TubiTV URL is not correctly formatted')
    process.exit(0)
  }

  switch(matches[1].toLowerCase()) {
    case 'movies':
      argv_vals["--url-type"] = 'movie'
      break
    case 'tv-shows':
      argv_vals["--url-type"] = 'episode'
      break
    case 'series':
      argv_vals["--url-type"] = 'series'
      break
  }
}

module.exports = argv_vals
