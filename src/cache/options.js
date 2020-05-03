import filterObj from 'filter-obj'
import { validate } from 'jest-validate'

// Normalize options and assign default values
export const getOpts = function (getCachePath, opts = {}) {
  validate({ ...opts, getCachePath }, { exampleConfig: EXAMPLE_OPTS })

  const optsA = filterObj(opts, isDefined)
  const optsB = { ...DEFAULT_OPTS, ...optsA }
  return optsB
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
  strict: true,
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
