import filterObj from 'filter-obj'
import { validate } from 'jest-validate'

// Normalize options and assign default values
export const getOpts = function (opts = {}) {
  validate(opts, { exampleConfig: EXAMPLE_OPTS })

  const optsA = filterObj(opts, isDefined)
  const optsB = { ...DEFAULT_OPTS, ...optsA }

  const { fetch, mirror } = optsB
  const fetchNodeOpts = { mirror }
  return { fetch, fetchNodeOpts }
}

const DEFAULT_OPTS = {}

const EXAMPLE_OPTS = {
  ...DEFAULT_OPTS,
  fetch: true,
  // Passed to `fetch-node-website`
  mirror: 'https://nodejs.org/dist',
}

const isDefined = function (key, value) {
  return value !== undefined
}
