import { normalize } from 'path'

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
const kMoizeFs = function (func, getCachePath, opts) {
  const {
    useCache,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
    cacheInfo,
  } = getOpts(getCachePath, opts)
  const processMoized = kMoize(fsMoized, {
    maxArgs: 1,
    isPromise: true,
    maxAge,
    updateExpire: Boolean(updateAge),
  })
  return (...args) =>
    callMoizedFunc({
      processMoized,
      func,
      args,
      getCachePath,
      useCache,
      maxAge,
      updateAge,
      serialization,
      strict,
      streams,
      cacheInfo,
    })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const callMoizedFunc = function ({
  processMoized,
  func,
  args,
  getCachePath,
  useCache,
  maxAge,
  updateAge,
  serialization,
  strict,
  streams,
  cacheInfo,
}) {
  const shouldUseCache = useCache(...args)
  const cachePath = normalize(getCachePath(...args))

  // TODO: add value back if `kFileMoized` throws
  // TODO: maybe find a better way to make moize not read cache, but still write
  // it on success
  if (!shouldUseCache) {
    processMoized.remove([cachePath])
  }

  return processMoized(cachePath, {
    func,
    args,
    shouldUseCache,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
    cacheInfo,
  })
}

const fsMoized = async function (
  cachePath,
  {
    func,
    args,
    shouldUseCache,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
    cacheInfo,
  },
) {
  const fsCachedValue = await getFsCache({
    cachePath,
    shouldUseCache,
    maxAge,
    updateAge,
    serialization,
    cacheInfo,
  })

  if (fsCachedValue !== undefined) {
    return fsCachedValue
  }

  try {
    const returnValue = await func(...args)
    const nonCachedValue = await writeFsCache({
      cachePath,
      returnValue,
      serialization,
      strict,
      streams,
      cacheInfo,
    })
    return nonCachedValue
  } catch (error) {
    return handleOfflineError({ cachePath, serialization, cacheInfo, error })
  }
}

const getFsCache = function ({
  cachePath,
  shouldUseCache,
  maxAge,
  updateAge,
  serialization,
  cacheInfo,
}) {
  if (!shouldUseCache) {
    return
  }

  return readFsCache({
    cachePath,
    useMaxAge: true,
    maxAge,
    updateAge,
    serialization,
    cacheInfo,
  })
}
