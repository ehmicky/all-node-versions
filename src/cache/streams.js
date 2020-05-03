import { Buffer } from 'buffer'
import { createWriteStream } from 'fs'
import { pipeline, PassThrough, Readable } from 'stream'
import { promisify } from 'util'

const pPipeline = promisify(pipeline)

// Write a stream, optionally returning the buffered content
export const writeStream = async function (tmpFile, stream, streams) {
  validateStream(stream, streams)

  if (streams === 'pipe') {
    await pPipeline(stream, createWriteStream(tmpFile))
    return
  }

  const { passThrough, state } = getPassThrough()
  await pPipeline(stream, passThrough, createWriteStream(tmpFile))
  const content = getContent(state)
  return content
}

const validateStream = function (stream, streams) {
  if (streams === 'error') {
    throw new Error('Must not use streams')
  }

  if (stream.readableObjectMode) {
    throw new Error('Stream must not be in object mode')
  }

  if (!(stream instanceof Readable)) {
    throw new TypeError('Stream must be readable')
  }
}

// Read content written by stream
// TODO: use `get-stream` internals instead.
// See https://github.com/sindresorhus/get-stream/issues/37
const getPassThrough = function () {
  const state = { chunks: [], length: 0 }
  const passThrough = new PassThrough()
  passThrough.on('data', (chunk) => {
    // eslint-disable-next-line fp/no-mutating-methods
    state.chunks.push(chunk)
    // eslint-disable-next-line fp/no-mutation
    state.length += chunk.length
  })
  return { passThrough, state }
}

const getContent = function ({ chunks, length }) {
  return Buffer.concat(chunks, length).toString()
}
