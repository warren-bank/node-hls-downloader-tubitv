const path = require('path')
const fs   = require('fs')

const createDirectory = (dirpath) => {
  if (!dirpath || (typeof dirpath !== 'string')) return
  let parts

  parts = dirpath.split(path.sep)
  parts = parts.filter(part => !!part)
  if (dirpath.indexOf(path.sep) === 0) {
    parts.unshift(path.sep)
  }
  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)))
  }
}

const mkdirSync = (dirpath) => {
  if (dirpath === path.sep) return

  try {
    fs.mkdirSync(dirpath)
  } catch (e) {
    if (e.code !== 'EEXIST') throw e
  }
}

module.exports = createDirectory
