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
  const { useCache, maxAge, strict } = getOpts(getCachePath, opts)
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
    strict,
  })
}

const fsMoized = async function (
  cachePath,
  { func, args, shouldUseCache, maxAge, strict },
) {
  const timestampPath = `${cachePath}${TIMESTAMP_FILE_EXTENSION}`
  const fileValue = await getFsCache({
    cachePath,
    timestampPath,
    shouldUseCache,
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

// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_FILE_EXTENSION = '.timestamp.txt'

const getFsCache = function ({
  cachePath,
  timestampPath,
  shouldUseCache,
  maxAge,
}) {
  if (!shouldUseCache) {
    return
  }

  return readFsCache({ cachePath, timestampPath, useMaxAge: true, maxAge })
}
