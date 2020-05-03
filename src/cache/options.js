import filterObj from 'filter-obj'
import { validate } from 'jest-validate'

// Normalize options and assign default values
export const getOpts = function (getCachePath, opts = {}) {
  validate({ ...opts, getCachePath }, { exampleConfig: EXAMPLE_OPTS })

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

const isDefined = function (key, value) {
  return value !== undefined
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
