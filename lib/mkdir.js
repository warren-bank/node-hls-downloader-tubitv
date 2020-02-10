const path = require('path')
const fs   = require('fs')

const createDirectory = (dirpath) => {
  let parts = dirpath.split(path.sep)
  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)))
  }
}

const mkdirSync = (path) => {
  try {
    fs.mkdirSync(path)
  } catch (e) {
    if (e.code !== 'EEXIST') throw e
  }
}

module.exports = createDirectory
