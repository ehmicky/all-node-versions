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
    shouldForceRefresh,
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
      shouldForceRefresh,
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
  shouldForceRefresh,
  maxAge,
  updateAge,
  serialization,
  strict,
  streams,
  cacheInfo,
}) {
  const forceRefresh = shouldForceRefresh(...args)
  const cachePath = normalize(getCachePath(...args))

  // TODO: add value back if `kFileMoized` throws
  // TODO: maybe find a better way to make moize not read cache, but still write
  // it on success
  if (forceRefresh) {
    processMoized.remove([cachePath])
  }

  return processMoized(cachePath, {
    func,
    args,
    forceRefresh,
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
    forceRefresh,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
    cacheInfo,
  },
) {
  const { returnValue, cached } = await getReturnInfo({
    cachePath,
    func,
    args,
    forceRefresh,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
  })

  if (cacheInfo) {
    return cached ? cachePath : undefined
  }

  return returnValue
}

const getReturnInfo = async function ({
  cachePath,
  func,
  args,
  forceRefresh,
  maxAge,
  updateAge,
  serialization,
  strict,
  streams,
}) {
  const returnInfo = await readFsCache({
    cachePath,
    forceRefresh,
    useMaxAge: true,
    maxAge,
    updateAge,
    serialization,
  })

  if (returnInfo.cached) {
    return returnInfo
  }

  try {
    const returnValue = await func(...args)
    return await writeFsCache({
      cachePath,
      returnValue,
      serialization,
      strict,
      streams,
    })
  } catch (error) {
    return handleOfflineError({ cachePath, serialization, error })
  }
}
