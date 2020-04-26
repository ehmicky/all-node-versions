import filterObj from 'filter-obj'
import { validate } from 'jest-validate'

// Normalize options and assign default values
export const getOpts = function (opts = {}) {
  validate(opts, { exampleConfig: EXAMPLE_OPTS })

  const optsA = filterObj(opts, isDefined)
  const optsB = { ...DEFAULT_OPTS, ...optsA }
  return optsB
}

const DEFAULT_OPTS = {
  // TODO: allow boolean
  shouldCacheProcess() {
    return true
  },
  // TODO: allow boolean
  shouldCacheFile() {
    return true
  },
}

const EXAMPLE_OPTS = {
  ...DEFAULT_OPTS,
}

const isDefined = function (key, value) {
  return value !== undefined
}
