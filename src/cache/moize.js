import { createReadStream } from 'fs'
import { normalize } from 'path'

import keepFuncProps from 'keep-func-props'
import moize from 'moize'

import { readFsCache, writeFsCache, refreshFileExpireAt } from './fs.js'
import { handleOfflineError } from './offline.js'
import { getOpts } from './options.js'

const kMoize = keepFuncProps(moize)

// Moize a function:
//  - process-wise, like a regular memoization library
//  - but also on the filesystem
// Also handles offline connections.
const kMoizeFs = function (func, getCachePath, opts) {
  const {
    shouldInvalidate,
    maxAge,
    updateExpire,
    serialization,
    strict,
    stream: streamOpt,
    cacheInfo,
  } = getOpts(getCachePath, opts)
  const processMoized = kMoize(fsMoized, {
    maxArgs: 1,
    isPromise: true,
    maxAge,
    updateExpire: Boolean(updateExpire),
  })
  const removeProcessPath = invalidateCachePath.bind(undefined, processMoized)
  return callMoizedFunc.bind(undefined, {
    processMoized,
    removeProcessPath,
    func,
    getCachePath,
    shouldInvalidate,
    maxAge,
    updateExpire,
    serialization,
    strict,
    streamOpt,
    cacheInfo,
  })
}

export const moizeFs = keepFuncProps(kMoizeFs)

const invalidateCachePath = function (processMoized, cachePath) {
  processMoized.remove([cachePath])
}

const callMoizedFunc = async function (
  {
    processMoized,
    removeProcessPath,
    func,
    getCachePath,
    shouldInvalidate,
    maxAge,
    updateExpire,
    serialization,
    strict,
    streamOpt,
    cacheInfo,
  },
  ...args
) {
  const invalidate = shouldInvalidate(args)
  const cachePath = normalize(getCachePath(args))

  // TODO: add value back if `kFileMoized` throws
  // TODO: maybe find a better way to make moize not read cache, but still write
  // it on success
  if (invalidate) {
    removeProcessPath(cachePath)
  }

  const info = { state: 'process' }
  const returnInfo = await processMoized(cachePath, {
    func,
    args,
    invalidate,
    maxAge,
    serialization,
    strict,
    streamOpt,
    info,
  })
  const returnInfoA = applyInfo({ returnInfo, info, cachePath, streamOpt })

  const returnInfoB = await syncCache({
    returnInfo: returnInfoA,
    cachePath,
    removeProcessPath,
    maxAge,
    updateExpire,
  })

  const returnInfoC = applyCacheInfo(returnInfoB, cacheInfo)
  return returnInfoC
}

const fsMoized = async function (
  cachePath,
  { func, args, invalidate, maxAge, serialization, strict, streamOpt, info },
) {
  const { state, ...returnInfo } = await getReturnInfo({
    cachePath,
    func,
    args,
    invalidate,
    maxAge,
    serialization,
    strict,
    streamOpt,
  })
  // This function is memoized in-memory. To distinguish between memoized calls
  // or not, we need to do a side-effect like this.
  // eslint-disable-next-line fp/no-mutation, no-param-reassign
  info.state = state

  if (!streamOpt) {
    return returnInfo
  }

  const { returnValue, ...returnInfoA } = returnInfo
  // This function is memoized in-memory. We don't want to memoize streams since
  // they are stateful, so we pass them using a side-effect like this.
  // eslint-disable-next-line fp/no-mutation, no-param-reassign
  info.returnValue = returnValue
  return returnInfoA
}

const getReturnInfo = async function ({
  cachePath,
  func,
  args,
  invalidate,
  maxAge,
  serialization,
  strict,
  streamOpt,
}) {
  const returnInfo = await readFsCache({
    cachePath,
    invalidate,
    serialization,
    streamOpt,
    offline: false,
  })

  if (returnInfo.state === 'file') {
    return returnInfo
  }

  try {
    const returnValue = await func(...args)
    return await writeFsCache({
      cachePath,
      returnValue,
      maxAge,
      serialization,
      strict,
      streamOpt,
    })
  } catch (error) {
    return handleOfflineError({ cachePath, serialization, streamOpt, error })
  }
}

const applyInfo = function ({
  returnInfo,
  returnInfo: { path },
  info: { state, returnValue },
  streamOpt,
}) {
  const returnInfoA = { ...returnInfo, state }

  if (!streamOpt) {
    return returnInfoA
  }

  if (state !== 'process') {
    return { ...returnInfoA, returnValue }
  }

  if (path === undefined) {
    return returnInfoA
  }

  return { ...returnInfoA, returnValue: createReadStream(path) }
}

// Keep the process cache and file cache `expireAt` in-sync
const syncCache = async function ({
  returnInfo,
  returnInfo: { state, expireAt },
  cachePath,
  removeProcessPath,
  maxAge,
  updateExpire,
}) {
  refreshProcessExpireAt({
    removeProcessPath,
    cachePath,
    updateExpire,
    expireAt,
    state,
  })

  const expireAtA = await refreshFileExpireAt({
    cachePath,
    updateExpire,
    expireAt,
    maxAge,
    state,
  })

  if (expireAtA === undefined) {
    return returnInfo
  }

  return { ...returnInfo, expireAt: expireAtA }
}

// When the function has been cached on file by a different process, the new
// process will cache it in-process using the file-cached value. However, the
// TTL of the process cache must match the one left in-file so that are in sync.
// If `updateExpire` is `true`, this is not needed since the
// TTL will === maxAge.
const refreshProcessExpireAt = function ({
  removeProcessPath,
  cachePath,
  updateExpire,
  expireAt,
  state,
}) {
  if (updateExpire || state !== 'file') {
    return
  }

  const ttl = Math.min(expireAt - Date.now(), MAX_TIMEOUT)
  setTimeout(removeProcessPath.bind(undefined, cachePath), ttl).unref()
}

// `setTimeout()` argument has a maximum value in Node.js. That's 25 days.
// eslint-disable-next-line no-magic-numbers
const MAX_TIMEOUT = 2 ** 31 - 1

// Use `cacheInfo: true`, return more caching-related information
const applyCacheInfo = function (returnInfo, cacheInfo) {
  if (!cacheInfo) {
    return returnInfo.returnValue
  }

  return returnInfo
}
