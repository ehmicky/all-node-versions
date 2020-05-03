import { normalize } from 'path'

import keepFuncProps from 'keep-func-props'
import moize from 'moize'

import { readFsCache, writeFsCache, refreshExpireAt } from './fs.js'
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

const callMoizedFunc = async function ({
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

  const info = { state: 'process' }
  const returnInfo = await processMoized(cachePath, {
    func,
    args,
    forceRefresh,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
    cacheInfo,
    processMoized,
    info,
  })

  if (!cacheInfo) {
    return returnInfo
  }

  const expireAt = await refreshExpireAt({
    cachePath,
    updateAge,
    expireAt: returnInfo.expireAt,
    maxAge,
    state: info.state,
  })

  if (expireAt === undefined) {
    return { ...returnInfo, state: info.state }
  }

  return { ...returnInfo, state: info.state, expireAt }
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
    processMoized,
    info,
  },
) {
  const returnInfo = await getReturnInfo({
    cachePath,
    func,
    args,
    forceRefresh,
    maxAge,
    updateAge,
    serialization,
    strict,
    streams,
    processMoized,
  })

  if (!cacheInfo) {
    return returnInfo.returnValue
  }

  // This function is memoized in-memory. To distinguish between memoized calls
  // or not, we need to do a side-effect like this.
  // eslint-disable-next-line fp/no-mutation, no-param-reassign
  info.state = returnInfo.state

  return returnInfo
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
  processMoized,
}) {
  const returnInfo = await readFsCache({
    cachePath,
    forceRefresh,
    useMaxAge: true,
    serialization,
  })

  if (returnInfo.state !== undefined) {
    updateProcessCacheTime({
      processMoized,
      cachePath,
      updateAge,
      expireAt: returnInfo.expireAt,
    })
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
      streams,
    })
  } catch (error) {
    return handleOfflineError({ cachePath, serialization, error })
  }
}

// When the function has been cached on file by a different process, the new
// process will cache it in-process using the file-cached value. However, the
// TTL of the process cache must match the one left in-file so that are in sync.
// If `updateAge` is `true`, this is not needed since the TTL will === maxAge.
const updateProcessCacheTime = function ({
  processMoized,
  cachePath,
  updateAge,
  expireAt,
}) {
  if (updateAge) {
    return
  }

  const ttl = Math.min(expireAt - Date.now(), MAX_TIMEOUT)
  setTimeout(() => {
    processMoized.remove([cachePath])
  }, ttl).unref()
}

// `setTimeout()` argument has a maximum value in Node.js. That's 25 days.
// eslint-disable-next-line no-magic-numbers
const MAX_TIMEOUT = 2 ** 31 - 1
