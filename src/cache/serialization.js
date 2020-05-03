import { serialize as v8Serialize, deserialize as v8Deserialize } from 'v8'

// If the cache file is corrupted, ignore it
export const parse = function (cacheContent, { serialization }) {
  try {
    return SERIALIZATIONS[serialization].parse(cacheContent)
  } catch {}
}

export const serialize = function (returnValue, { serialization, strict }) {
  try {
    return SERIALIZATIONS[serialization].serialize(returnValue)
  } catch (error) {
    handleSerializeError(error, strict)
  }
}

const handleSerializeError = function (error, strict) {
  if (!strict) {
    return
  }

  // eslint-disable-next-line no-param-reassign, fp/no-mutation
  error.message = `Could not cache the return value: not serializable with the structured cloned algorithm\n${error.message}`
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
