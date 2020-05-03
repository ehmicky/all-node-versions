import { promises as fs } from 'fs'
import { Stream } from 'stream'

import pathExists from 'path-exists'

import { writeStream } from './streams.js'

// Writing the cache file should be atomic, so we don't leave partially written
// files. We cannot use libraries like `write-file-atomic` because they don't
// support streams.
export const writeAtomic = async function (filePath, content) {
  const tmpFile = getTmpFile(filePath)

  if (content instanceof Stream) {
    const { tmpFileStream, tmpFilePromise } = await writeStream(
      tmpFile,
      content,
    )
    renameFileOnEnd(tmpFilePromise, tmpFile, filePath)
    return tmpFileStream
  }

  const tmpFilePromiseA = fs.writeFile(tmpFile, content)
  await renameFileOnEnd(tmpFilePromiseA, tmpFile, filePath)
}

// Use a sibling file because `fs.rename()` does not work between partitions
const getTmpFile = function (filePath) {
  const uniqueId = String(Math.random()).replace('.', '')
  return `${filePath}.${uniqueId}`
}

const renameFileOnEnd = async function (promise, tmpFile, filePath) {
  try {
    await promise
    await fs.rename(tmpFile, filePath)
  } catch (error) {
    await cleanTmpFile(tmpFile)
  }
}

// The temporary file might still exist if:
//  - another parallel write was running
//  - an error was thrown (including inside the stream)
const cleanTmpFile = async function (tmpFile) {
  if (!(await pathExists(tmpFile))) {
    return
  }

  try {
    await fs.unlink(tmpFile)
  } catch {}
}
