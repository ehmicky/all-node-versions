import filterObj from 'filter-obj'
import { validate } from 'jest-validate'

// Normalize options and assign default values
export const getOpts = function (opts = {}) {
  validate(opts, { exampleConfig: EXAMPLE_OPTS })

  const optsA = filterObj(opts, isDefined)
  const optsB = { ...DEFAULT_OPTS, ...optsA }
  return optsB
}

// One hour
const DEFAULT_MAX_AGE_MS = 36e5

const DEFAULT_OPTS = {
  useCache() {
    return true
  },
  maxAge: DEFAULT_MAX_AGE_MS,
  strict: true,
}

const EXAMPLE_OPTS = {
  ...DEFAULT_OPTS,
}

const isDefined = function (key, value) {
  return value !== undefined
}
