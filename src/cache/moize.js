import { normalize } from 'path'
import { env } from 'process'

import keepFuncProps from 'keep-func-props'
import moize from 'moize'

import { readFsCache, writeFsCache } from './fs.js'
import { handleOfflineError } from './offline.js'
import { getOpts } from './options.js'

const kMoize = keepFuncProps(moize)

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
const kMoizeFs = function (func, cacheOption, opts) {
  const { useCache, maxAge, strict } = getOpts(opts)
  const getCacheValue = getCacheOption.bind(undefined, cacheOption)
  const kFileMoized = moizeFileMoized(getCacheValue, maxAge)
  return (...args) =>
    processMoized({
      func,
      kFileMoized,
      args,
      getCacheValue,
      useCache,
      maxAge,
      strict,
    })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const moizeFileMoized = function (getCacheValue, maxAge) {
  return kMoize(fileMoized, {
    isSerialized: true,
    serializer: getCacheValue,
    isPromise: true,
    // TODO: re-enable after the following bug is fixed:
    // https://github.com/planttheidea/moize/issues/122
    // maxAge,
  })
}

const processMoized = function ({
  func,
  kFileMoized,
  args,
  getCacheValue,
  useCache,
  maxAge,
  strict,
}) {
  const useCacheValue = useCache(...args)
  const cacheValue = getCacheValue(args)

  // TODO: add value back if `kFileMoized` throws
  // TODO: maybe find a better way to make moize not read cache, but still write
  // it on success
  if (!useCacheValue || env.TEST_CACHE_FILENAME) {
    kFileMoized.remove(cacheValue)
  }

  return kFileMoized(args, { func, cacheValue, useCacheValue, maxAge, strict })
}

const getCacheOption = function (cacheOption, args) {
  const cacheValue =
    typeof cacheOption === 'function' ? cacheOption(...args) : cacheOption
  const cacheValueA = normalize(cacheValue)
  return cacheValueA
}

const fileMoized = async function (
  args,
  { func, cacheValue, useCacheValue, maxAge, strict },
) {
  const { cachePath, timestampPath } = getCachePath(cacheValue)
  const fileValue = await getFsCache({
    cachePath,
    timestampPath,
    useCacheValue,
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
    return handleOfflineError({ cachePath, timestampPath, error })
  }
}

const getCachePath = function (cacheValue) {
  const cachePath = `${cacheValue}${CACHE_FILE_EXTENSION}`
  const timestampPath = `${cacheValue}${TIMESTAMP_FILE_EXTENSION}`
  return { cachePath, timestampPath }
}

const CACHE_FILE_EXTENSION = '.v8.bin'
// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_FILE_EXTENSION = '.timestamp.txt'

const getFsCache = function ({
  cachePath,
  timestampPath,
  useCacheValue,
  maxAge,
}) {
  if (!useCacheValue) {
    return
  }

  return readFsCache({ cachePath, timestampPath, useMaxAge: true, maxAge })
}
