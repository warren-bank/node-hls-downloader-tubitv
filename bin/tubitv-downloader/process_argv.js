const process_argv = require('@warren-bank/node-process-argv')

const path = require('path')
const fs   = require('fs')

const argv_flags = {
  "--help":                   {bool:  true},
  "--version":                {bool:  true},
  "--quiet":                  {bool:  true},
  "--dry-run":                {bool:  true},
  "--no-mp4":                 {bool:  true},
  "--log-level":              {num:   "int"},
  "--mp4-filename":           {num:   "int"},
  "--max-concurrency":        {num:   "int"},
  "--directory-prefix":       {},
  "--url":                    {},
  "--input-file":             {file: "lines"}
}

const argv_flag_aliases = {
  "--help":                   ["-h"],
  "--version":                ["-v"],
  "--quiet":                  ["-q"],
  "--dry-run":                ["-dr"],
  "--no-mp4":                 ["-nm"],
  "--log-level":              ["-ll"],
  "--mp4-filename":           ["-mf"],
  "--max-concurrency":        ["-mc", "--threads"],
  "--directory-prefix":       ["-P"],
  "--url":                    ["-u"],
  "--input-file":             ["-i"]
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

if (typeof argv_vals["--log-level"] !== 'number') {
  argv_vals["--log-level"] = 3
}
if (argv_vals["--log-level"] <= 0) {
  argv_vals["--log-level"] = 0
  argv_vals["--quiet"] = true
}
if (argv_vals["--log-level"] > 3) {
  argv_vals["--log-level"] = 3
}

if (typeof argv_vals["--max-concurrency"] === 'number') {
  if (argv_vals["--max-concurrency"] < 1) {
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

if (argv_vals["--input-file"] && argv_vals["--input-file"].length) {
  if (argv_vals["--url"]) {
    argv_vals["--input-file"].unshift(argv_vals["--url"])
    delete argv_vals["--url"]
  }
}
else if (!argv_vals["--url"]) {
  console.log('ERROR: TubiTV URL is required')
  process.exit(0)
}

if (argv_vals["--dry-run"] && argv_vals["--quiet"]) {
  console.log('WARNING: Nothing to do')
  process.exit(0)
}

module.exports = argv_vals
