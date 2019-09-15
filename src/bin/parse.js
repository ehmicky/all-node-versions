import { omitBy } from '../utils.js'

export const parseOpts = function(yargs) {
  const opts = yargs.parse()
  const optsA = omitBy(opts, isInternalKey)
  return optsA
}

// Remove `yargs`-specific options, shortcuts and dash-cased
const isInternalKey = function(key, value) {
  return (
    value === undefined ||
    INTERNAL_KEYS.includes(key) ||
    key.length === 1 ||
    key.includes('-')
  )
}

const INTERNAL_KEYS = ['help', 'version', '_', '$0']
