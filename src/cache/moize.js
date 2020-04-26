import { normalize } from 'path'
import { env } from 'process'

import keepFuncProps from 'keep-func-props'

import { readFsCache, writeFsCache } from './fs.js'
import { handleOfflineError } from './offline.js'
import { getOpts } from './options.js'

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
const kMoizeFs = function (func, cacheOption, opts) {
  const { useCache, useMaxAge, maxAge, strict } = getOpts(opts)
  const state = {}
  return (...args) =>
    processMoized({
      func,
      args,
      state,
      cacheOption,
      useCache,
      useMaxAge,
      maxAge,
      strict,
    })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const processMoized = async function ({
  func,
  args,
  state,
  cacheOption,
  useCache,
  useMaxAge,
  maxAge,
  strict,
}) {
  const useCacheValue = useCache(...args)

  if (
    state.processValue !== undefined &&
    useCacheValue &&
    !env.TEST_CACHE_FILENAME
  ) {
    return state.processValue
  }

  const returnValue = await fileMoized({
    func,
    args,
    cacheOption,
    useCacheValue,
    useMaxAge,
    maxAge,
    strict,
  })
  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processValue = returnValue
  return returnValue
}

const fileMoized = async function ({
  func,
  args,
  cacheOption,
  useCacheValue,
  useMaxAge,
  maxAge,
  strict,
}) {
  const { cachePath, timestampPath } = getCachePath(cacheOption, args)
  const fileValue = await getFsCache({
    cachePath,
    timestampPath,
    args,
    useCacheValue,
    useMaxAge,
    maxAge,
  })

  if (fileValue !== undefined) {
    return fileValue
  }

  try {
    const returnValue = await func(...args)
    await writeFsCache({ cachePath, timestampPath, returnValue, strict })
    return returnValue
  } catch (error) {
    return handleOfflineError({ cachePath, timestampPath, error, args })
  }
}

const getCachePath = function (cacheOption, args) {
  const cachePathValue =
    typeof cacheOption === 'function' ? cacheOption(...args) : cacheOption
  const cachePathValueA = normalize(cachePathValue)
  const cachePath = `${cachePathValueA}${CACHE_FILE_EXTENSION}`
  const timestampPath = `${cachePathValueA}${TIMESTAMP_FILE_EXTENSION}`
  return { cachePath, timestampPath }
}

const CACHE_FILE_EXTENSION = '.v8.bin'
// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_FILE_EXTENSION = '.timestamp.txt'

const getFsCache = function ({
  cachePath,
  timestampPath,
  args,
  useCacheValue,
  useMaxAge,
  maxAge,
}) {
  if (!useCacheValue) {
    return
  }

  return readFsCache({ cachePath, timestampPath, args, useMaxAge, maxAge })
}
