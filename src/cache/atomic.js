import { promises as fs } from 'fs'
import { Stream } from 'stream'

import pathExists from 'path-exists'

import { writeStream } from './streams.js'

// Writing the cache file should be atomic, so we don't leave partially written
// files. We cannot use libraries like `write-file-atomic` because they don't
// support streams.
export const writeAtomic = async function (
  filePath,
  content,
  returnStreamContent,
) {
  const tmpFile = getTmpFile(filePath)

  try {
    const streamContent = await writeContent(
      tmpFile,
      content,
      returnStreamContent,
    )
    await fs.rename(tmpFile, filePath)
    return streamContent
  } finally {
    await cleanTmpFile(tmpFile)
  }
}

// Use a sibling file because `fs.rename()` does not work between partitions
const getTmpFile = function (filePath) {
  const uniqueId = String(Math.random()).replace('.', '')
  return `${filePath}.${uniqueId}`
}

const writeContent = async function (tmpFile, content, returnStreamContent) {
  if (content instanceof Stream) {
    return writeStream(tmpFile, content, returnStreamContent)
  }

  await fs.writeFile(tmpFile, content)
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
