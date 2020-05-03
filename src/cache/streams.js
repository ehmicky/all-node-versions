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
  return state.content
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
const getPassThrough = function () {
  const state = { content: '' }
  const passThrough = new PassThrough({ encoding: 'utf8' })
  passThrough.on('data', (chunk) => {
    // eslint-disable-next-line fp/no-mutation
    state.content += chunk
  })
  return { passThrough, state }
}
