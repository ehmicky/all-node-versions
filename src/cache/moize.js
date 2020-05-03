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
  const { useCache, maxAge, serialization, strict } = getOpts(
    getCachePath,
    opts,
  )
  const processMoized = kMoize(fsMoized, {
    maxArgs: 1,
    isPromise: true,
    // TODO: re-enable after the following bug is fixed:
    // https://github.com/planttheidea/moize/issues/122
    // maxAge,
  })
  return (...args) =>
    callMoizedFunc({
      processMoized,
      func,
      args,
      getCachePath,
      useCache,
      maxAge,
      serialization,
      strict,
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
  serialization,
  strict,
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
    serialization,
    strict,
  })
}

const fsMoized = async function (
  cachePath,
  { func, args, shouldUseCache, maxAge, serialization, strict },
) {
  const fileValue = await getFsCache({
    cachePath,
    shouldUseCache,
    maxAge,
    serialization,
  })

  if (fileValue !== undefined) {
    return fileValue
  }

  try {
    const returnValue = await func(...args)
    await writeFsCache({ cachePath, returnValue, serialization, strict })
    return returnValue
  } catch (error) {
    return handleOfflineError({ cachePath, serialization, error })
  }
}

const getFsCache = function ({
  cachePath,
  shouldUseCache,
  maxAge,
  serialization,
}) {
  if (!shouldUseCache) {
    return
  }

  return readFsCache({ cachePath, useMaxAge: true, maxAge, serialization })
}
