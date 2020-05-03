import { createWriteStream } from 'fs'
import { pipeline, PassThrough, Readable } from 'stream'
import { promisify } from 'util'

const pPipeline = promisify(pipeline)

// Write a stream, optionally returning the buffered content
export const writeStream = async function (tmpFile, stream, buffer) {
  if (stream.readableObjectMode) {
    throw new Error('Stream must not be in object mode')
  }

  if (!(stream instanceof Readable)) {
    throw new TypeError('Stream must be readable')
  }

  if (!buffer) {
    await pPipeline(stream, createWriteStream(tmpFile))
    return
  }

  const { passThrough, state } = getPassThrough()
  await pPipeline(stream, passThrough, createWriteStream(tmpFile))
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
