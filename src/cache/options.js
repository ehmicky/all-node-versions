import filterObj from 'filter-obj'
import { validate } from 'jest-validate'

import { validateEnums } from './enum.js'

// Normalize options and assign default values
export const getOpts = function (getCachePath, opts = {}) {
  validate({ ...opts, getCachePath }, { exampleConfig: EXAMPLE_OPTS })
  customValidate(opts)

  const optsA = addSerialization({ opts })
  const optsB = filterObj(optsA, isDefined)
  const optsC = { ...DEFAULT_OPTS, ...optsB }
  return optsC
}

// One hour
const DEFAULT_MAX_AGE_MS = 36e5

const DEFAULT_OPTS = {
  shouldForceRefresh() {
    return false
  },
  maxAge: DEFAULT_MAX_AGE_MS,
  updateAge: false,
  serialization: 'v8',
  strict: false,
  streams: 'error',
  cacheInfo: false,
}

const EXAMPLE_OPTS = {
  ...DEFAULT_OPTS,
  getCachePath() {
    return '/path/to/cache.json'
  },
}

const customValidate = function ({ maxAge, ...opts }) {
  validateMaxAge(maxAge)
  validateEnums(opts, ENUMS)
}

const validateMaxAge = function (maxAge) {
  if (maxAge !== undefined && (!Number.isInteger(maxAge) || maxAge < 0)) {
    throw new Error(`The 'maxAge' option must be a positive integer: ${maxAge}`)
  }
}

const ENUMS = {
  serialization: ['none', 'json', 'v8'],
  streams: ['error', 'pipe', 'buffer'],
}

// Streams are piped directly to files without a serialization step
const addSerialization = function ({
  opts,
  opts: { serialization, streams = 'error' },
}) {
  if (streams === 'error') {
    return opts
  }

  if (serialization !== undefined && serialization !== 'none') {
    throw new Error(
      `The "serialization" option must be "none" when using the "streams": "${streams}" option`,
    )
  }

  return { ...opts, serialization: 'none' }
}

const isDefined = function (key, value) {
  return value !== undefined
}
