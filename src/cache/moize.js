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
  if (state.processValue !== undefined && shouldCacheProcess(...args)) {
    return state.processValue
  }

  const returnValue = await fileMoized({ func, args, getCachePath })
  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processValue = returnValue
  return returnValue
}

const fileMoized = async function ({ func, args, getCachePath }) {
  const cachePath = getCachePath(...args)
  const fileValue = await getFsCache({ cachePath, args })

  if (fileValue !== undefined) {
    return fileValue
  }

  try {
    const returnValue = await func(...args)
    await writeFsCache(cachePath, returnValue)
    return returnValue
  } catch (error) {
    return handleOfflineError({ cachePath, error, args, maxAge })
  }
}

const getFsCache = function ({ cachePath, args }) {
  if (shouldCacheFile !== undefined && !shouldCacheFile(...args)) {
    return
  }

  return readFsCache({ cachePath, args, maxAge })
}

// TODO: extract. Default always return true
const shouldCacheProcess = function ({ fetch }) {
  return fetch !== true && !env.TEST_CACHE_FILENAME
}

// TODO: extract
const shouldCacheFile = function ({ fetch }) {
  return fetch !== true
}

// TODO: extract
const maxAge = function ({ fetch }) {
  if (fetch === false) {
    return Infinity
  }

  return MAX_AGE_MS
}

// One hour
const MAX_AGE_MS = 36e5
