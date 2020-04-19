import { env } from 'process'

import keepFuncProps from 'keep-func-props'

import { readFsCache, writeFsCache } from './fs.js'
import { handleOfflineError } from './offline.js'

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
const kMoizeFs = function (func, getCachePath) {
  const state = {}
  return (...args) => processMoized({ func, args, state, getCachePath })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const processMoized = async function ({ func, args, state, getCachePath }) {
  const fetch = getFetchOption(...args)

  if (
    state.processValue !== undefined &&
    fetch !== true &&
    !env.TEST_CACHE_FILENAME
  ) {
    return state.processValue
  }

  const returnValue = await fileMoized({ func, fetch, args, getCachePath })
  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processValue = returnValue
  return returnValue
}

// TODO: opts.shouldCacheProcess(...args)->boolean
// and opts.shouldCacheFile(...args)->boolean
// (with default: always true)
const getFetchOption = function ({ fetch }) {
  return fetch
}

const fileMoized = async function ({ func, fetch, args, getCachePath }) {
  const cachePath = getCachePath(...args)
  const fileValue = await readFsCache(cachePath, fetch)

  if (fileValue !== undefined) {
    return fileValue
  }

  try {
    const returnValue = await func(...args)
    await writeFsCache(cachePath, returnValue)
    return returnValue
  } catch (error) {
    return handleOfflineError(cachePath, error)
  }
}
