import { Buffer } from 'buffer'
import { Stream } from 'stream'
import { isDeepStrictEqual } from 'util'
import { serialize as v8Serialize, deserialize as v8Deserialize } from 'v8'

export const parse = function (serializedValue, { serialization }) {
  if (serializedValue instanceof Stream) {
    return serializedValue
  }

  try {
    // eslint-disable-next-line max-depth
    if (Buffer.isBuffer(serializedValue)) {
      return SERIALIZATIONS[serialization].parseBuffer(serializedValue)
    }

    return SERIALIZATIONS[serialization].parseString(serializedValue)
  } catch {}
}

export const serialize = function (parsedValue, { serialization, strict }) {
  if (parsedValue instanceof Stream) {
    return parsedValue
  }

  try {
    const serializedValue = SERIALIZATIONS[serialization].serialize(parsedValue)
    checkSerialized(serializedValue, parsedValue, serialization)
    return serializedValue
  } catch (error) {
    handleSerializeError(error, { serialization, strict })
  }
}

// Ensure that the value is fully serializable by parsing it back and comparing
const checkSerialized = function (serializedValue, parsedValue, serialization) {
  const reparsedValue = parse(serializedValue, { serialization })

  if (!isDeepStrictEqual(reparsedValue, parsedValue)) {
    throw new Error('Some properties are not serializable')
  }
}

// If `strict` is `false` and the value is not serializable, we silently do not
// cache, instead of throwing
const handleSerializeError = function (error, { serialization, strict }) {
  if (!strict) {
    return
  }

  // eslint-disable-next-line no-param-reassign, fp/no-mutation
  error.message = `Could not serialize the return valued with "serialization": "${serialization}"\n${error.message}`
  throw error
}

const noneParse = function (serializedValue) {
  return serializedValue
}

const noneSerialize = function (returnValue) {
  if (typeof returnValue !== 'string') {
    throw new TypeError('The return value should be a string')
  }

  return returnValue
}

const jsonParseBuffer = function (buffer) {
  return jsonParseString(buffer.toString())
}

const jsonParseString = function (string) {
  return JSON.parse(string)
}

const jsonSerialize = function (returnValue) {
  return JSON.stringify(returnValue, undefined, 2)
}

const SERIALIZATIONS = {
  none: {
    parseBuffer: noneParse,
    parseString: noneParse,
    serialize: noneSerialize,
  },
  json: {
    parseBuffer: jsonParseBuffer,
    parseString: jsonParseString,
    serialize: jsonSerialize,
  },
  v8: { parseBuffer: v8Deserialize, serialize: v8Serialize },
}
