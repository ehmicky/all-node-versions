import keepFuncProps from 'keep-func-props'

import { readFsCache, writeFsCache } from './fs.js'
import { handleOfflineError } from './offline.js'
import { getOpts } from './options.js'

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
const kMoizeFs = function (func, cacheOption, opts) {
  const { shouldCacheProcess, shouldCacheFile, maxAge } = getOpts(opts)
  const state = {}
  return (...args) =>
    processMoized({
      func,
      args,
      state,
      cacheOption,
      shouldCacheProcess,
      shouldCacheFile,
      maxAge,
    })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const processMoized = async function ({
  func,
  args,
  state,
  cacheOption,
  shouldCacheProcess,
  shouldCacheFile,
  maxAge,
}) {
  if (state.processValue !== undefined && shouldCacheProcess(...args)) {
    return state.processValue
  }

  const returnValue = await fileMoized({
    func,
    args,
    cacheOption,
    shouldCacheFile,
    maxAge,
  })
  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processValue = returnValue
  return returnValue
}

const fileMoized = async function ({
  func,
  args,
  cacheOption,
  shouldCacheFile,
  maxAge,
}) {
  const cachePath = getCachePath(cacheOption, args)
  const fileValue = await getFsCache({
    cachePath,
    args,
    shouldCacheFile,
    maxAge,
  })

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

const getFsCache = function ({ cachePath, args, shouldCacheFile, maxAge }) {
  if (!shouldCacheFile(...args)) {
    return
  }

  return readFsCache({ cachePath, args, maxAge })
}
