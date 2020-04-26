import { env } from 'process'

import keepFuncProps from 'keep-func-props'

import { readFsCache, writeFsCache } from './fs.js'
import { handleOfflineError } from './offline.js'

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
const kMoizeFs = function (func, cacheOption) {
  const state = {}
  return (...args) => processMoized({ func, args, state, cacheOption })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const processMoized = async function ({ func, args, state, cacheOption }) {
  if (state.processValue !== undefined && shouldCacheProcess(...args)) {
    return state.processValue
  }

  const returnValue = await fileMoized({ func, args, cacheOption })
  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processValue = returnValue
  return returnValue
}

const fileMoized = async function ({ func, args, cacheOption }) {
  const cachePath = getCachePath(cacheOption, args)
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

const getCachePath = function (cacheOption, args) {
  if (typeof cacheOption !== 'function') {
    return cacheOption
  }

  return cacheOption(...args)
}

const getFsCache = function ({ cachePath, args }) {
  if (!shouldCacheFile(...args)) {
    return
  }

  return readFsCache({ cachePath, args, maxAge })
}

// TODO: extract. Make it default to () => true
const shouldCacheProcess = function ({ fetch }) {
  return fetch !== true && !env.TEST_CACHE_FILENAME
}

// TODO: extract. Make it default to () => true
const shouldCacheFile = function ({ fetch }) {
  return fetch !== true
}

// TODO: extract. Make it default to 1 hour
const maxAge = function ({ fetch }) {
  if (fetch === false) {
    return Infinity
  }

  return MAX_AGE_MS
}

// One hour
const MAX_AGE_MS = 36e5
