import { excludeKeys } from 'filter-obj'
import { validate } from 'jest-validate'

// Normalize options and assign default values
export const getOpts = function (opts = {}) {
  validate(opts, { exampleConfig: EXAMPLE_OPTS })

  const optsA = excludeKeys(opts, isUndefined)
  const optsB = { ...DEFAULT_OPTS, ...optsA }
  return optsB
}

const DEFAULT_OPTS = {}

const EXAMPLE_OPTS = {
  ...DEFAULT_OPTS,
  fetch: true,
  // Passed to `fetch-node-website`
  mirror: 'https://nodejs.org/dist',
}

const isUndefined = function (key, value) {
  return value === undefined
}
