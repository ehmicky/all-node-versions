import filterObj from 'filter-obj'

export const parseOpts = function(yargs) {
  const opts = yargs.parse()
  const optsA = filterObj(opts, isUserOpt)
  return optsA
}

// Remove `yargs`-specific options, shortcuts and dash-cased
const isUserOpt = function(key, value) {
  return (
    value !== undefined &&
    !INTERNAL_KEYS.includes(key) &&
    key.length !== 1 &&
    !key.includes('-')
  )
}

const INTERNAL_KEYS = ['help', 'version', '_', '$0']
