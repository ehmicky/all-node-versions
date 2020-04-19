import { env } from 'process'

import { readFsCache, writeFsCache } from './fs.js'
import { handleOfflineError } from './offline.js'

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
export const moizeFs = function (func) {
  const state = {}

  return function moizedFsFunction(...args) {
    return processMoized(func, args, state)
  }
}

const processMoized = async function (func, args, state) {
  const { fetch, args: argsA } = getFetchOption(args)

  if (
    state.processValue !== undefined &&
    fetch !== true &&
    !env.TEST_CACHE_FILENAME
  ) {
    return state.processValue
  }

  const returnValue = await fileMoized(func, fetch, argsA)
  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processValue = returnValue
  return returnValue
}

const getFetchOption = function ([{ fetch, ...arg }, ...argsA]) {
  return { fetch, args: [arg, ...argsA] }
}

const fileMoized = async function (func, fetch, args) {
  const fileValue = await readFsCache(fetch)

  if (fileValue !== undefined) {
    return fileValue
  }

  try {
    const returnValue = await func(...args)
    await writeFsCache(returnValue)
    return returnValue
  } catch (error) {
    return handleOfflineError(error)
  }
}
