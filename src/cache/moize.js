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
  const { cachePath, timestampPath } = getCachePath(cacheOption, args)
  const fileValue = await getFsCache({
    cachePath,
    timestampPath,
    args,
    shouldCacheFile,
    maxAge,
  })

  if (fileValue !== undefined) {
    return fileValue
  }

  try {
    const returnValue = await func(...args)
    await writeFsCache({ cachePath, timestampPath, returnValue })
    return returnValue
  } catch (error) {
    return handleOfflineError({ cachePath, timestampPath, error, args })
  }
}

const getCachePath = function (cacheOption, args) {
  const cachePathValue =
    typeof cacheOption === 'function' ? cacheOption(...args) : cacheOption
  const cachePath = `${cachePathValue}${CACHE_FILE_EXTENSION}`
  const timestampPath = `${cachePathValue}${TIMESTAMP_FILE_EXTENSION}`
  return { cachePath, timestampPath }
}

const CACHE_FILE_EXTENSION = '.v8.bin'
// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_FILE_EXTENSION = '.timestamp.txt'

const getFsCache = function ({
  cachePath,
  timestampPath,
  args,
  shouldCacheFile,
  maxAge,
}) {
  if (!shouldCacheFile(...args)) {
    return
  }

  return readFsCache({ cachePath, timestampPath, args, maxAge })
}
