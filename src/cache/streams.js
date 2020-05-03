import { promises as fs } from 'fs'
import { Readable, pipeline } from 'stream'
import { callbackify } from 'util'

import through from 'through2'

// Write a stream, optionally returning the buffered content
export const writeStream = async function (tmpFile, stream) {
  validateStream(stream)

  const writeFileStream = await getWriteFileStream(tmpFile)
  const { stream: tmpFileStream, promise } = pipelinePromise(
    stream,
    writeFileStream,
  )
  return { tmpFileStream, tmpFilePromise: promise }
}

const validateStream = function (stream) {
  if (!(stream instanceof Readable)) {
    throw new TypeError('Stream must be readable')
  }

  if (stream.readableObjectMode) {
    throw new Error('Stream must not be in object mode')
  }
}

// Like `createWriteStream()` but readable.
// Also append-only and error if file exists.
const getWriteFileStream = async function (tmpFile) {
  const fileHandle = await fs.open(tmpFile, 'ax')
  return through(
    transform.bind(undefined, fileHandle),
    flush.bind(undefined, fileHandle),
  )
}

const transform = callbackify(async function cTransform(fileHandle, chunk) {
  await fileHandle.write(chunk, 0, chunk.length)
  return chunk
})

const flush = callbackify(async function cFlush(fileHandle) {
  await fileHandle.close()
})

// Like `stream.pipeline()` but return both as `Promise` and as `Stream`
const pipelinePromise = function (...args) {
  // eslint-disable-next-line fp/no-let, init-declarations
  let stream
  // eslint-disable-next-line promise/avoid-new
  const promise = new Promise((resolve, reject) => {
    // eslint-disable-next-line fp/no-mutation
    stream = pipeline(...args, (error) => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  })
  return { stream, promise }
}
