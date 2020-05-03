import { Stream } from 'stream'
import { serialize as v8Serialize, deserialize as v8Deserialize } from 'v8'

// If the cache file is corrupted, ignore it
export const parse = function (cacheContent, { serialization }) {
  try {
    return SERIALIZATIONS[serialization].parse(cacheContent)
  } catch {}
}

export const serialize = function (returnValue, { serialization, strict }) {
  if (returnValue instanceof Stream) {
    return returnValue
  }

  try {
    const cacheContent = SERIALIZATIONS[serialization].serialize(returnValue)
    return cacheContent
  } catch (error) {
    handleSerializeError(error, { serialization, strict })
  }
}

const handleSerializeError = function (error, { serialization, strict }) {
  if (!strict) {
    return
  }

  // eslint-disable-next-line no-param-reassign, fp/no-mutation
  error.message = `Could not serialize the return value with "serialization": "${serialization}"\n${error.message}`
  throw error
}

const noParse = function (buffer) {
  return buffer.toString()
}

const noSerialize = function (returnValue) {
  if (typeof returnValue !== 'string') {
    throw new TypeError('The return value should be a string')
  }

  return returnValue
}

const jsonParse = function (buffer) {
  return JSON.parse(buffer.toString())
}

const jsonSerialize = function (returnValue) {
  return JSON.stringify(returnValue, undefined, 2)
}

const SERIALIZATIONS = {
  none: { parse: noParse, serialize: noSerialize },
  json: { parse: jsonParse, serialize: jsonSerialize },
  v8: { parse: v8Deserialize, serialize: v8Serialize },
}
