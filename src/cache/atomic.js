import { promises as fs, createWriteStream } from 'fs'
import { Stream, pipeline } from 'stream'
import { promisify } from 'util'

import pathExists from 'path-exists'

const pPipeline = promisify(pipeline)

// Writing the cache file should be atomic, so we don't leave partially written
// files. We cannot use libraries like `write-file-atomic` because they don't
// support streams.
export const writeAtomic = async function (filePath, content) {
  const tmpFile = getTmpFile(filePath)

  try {
    await writeContent(tmpFile, content)
    await fs.rename(tmpFile, filePath)
  } finally {
    await cleanTmpFile(tmpFile)
  }
}

// Use a sibling file because `fs.rename()` does not work between partitions
const getTmpFile = function (filePath) {
  const uniqueId = String(Math.random()).replace('.', '')
  return `${filePath}.${uniqueId}.download`
}

const writeContent = function (tmpFile, content) {
  if (content instanceof Stream) {
    return pPipeline(content, createWriteStream(tmpFile))
  }

  return fs.writeFile(tmpFile, content)
}

// The temporary file might still exist if:
//  - another parallel write was running
//  - an error was thrown (including inside the stream)
const cleanTmpFile = async function (tmpFile) {
  if (!(await pathExists(tmpFile))) {
    return
  }

  await fs.unlink(tmpFile)
}
