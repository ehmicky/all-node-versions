import { promises as fs, createWriteStream } from 'fs'
import { Readable, pipeline, PassThrough } from 'stream'
import { promisify } from 'util'

import pathExists from 'path-exists'

const pPipeline = promisify(pipeline)

// Writing the cache file should be atomic, so we don't leave partially written
// files. We cannot use libraries like `write-file-atomic` because they don't
// support streams.
export const writeAtomic = async function (filePath, content) {
  const tmpFile = getTmpFile(filePath)

  try {
    const contentA = await writeContent(tmpFile, content)
    await fs.rename(tmpFile, filePath)
    return contentA
  } finally {
    await cleanTmpFile(tmpFile)
  }
}

// Use a sibling file because `fs.rename()` does not work between partitions
const getTmpFile = function (filePath) {
  const uniqueId = String(Math.random()).replace('.', '')
  return `${filePath}.${uniqueId}.download`
}

const writeContent = async function (tmpFile, content) {
  if (!(content instanceof Readable)) {
    await fs.writeFile(tmpFile, content)
    return content
  }

  if (content.readableObjectMode) {
    throw new Error('Cannot return streams that are in object mode')
  }

  const { passThrough, state } = getPassThrough()
  await pPipeline(content, passThrough, createWriteStream(tmpFile))
  return state.content
}

// Read content written by stream
const getPassThrough = function () {
  const state = { content: '' }
  const passThrough = new PassThrough({ encoding: 'utf8' })
  passThrough.on('data', (chunk) => {
    // eslint-disable-next-line fp/no-mutation
    state.content += chunk
  })
  return { passThrough, state }
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
