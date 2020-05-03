import { readFsCache } from './fs.js'

// When offline, we try to reuse the file-cached value if any is available.
// We do this even if `fetch` option is `true`.
export const handleOfflineError = async function ({
  cachePath,
  serialization,
  cacheInfo,
  error,
}) {
  if (!isOfflineError(error)) {
    throw error
  }

  const fsCachedValue = await readFsCache({
    cachePath,
    useMaxAge: false,
    updateAge: false,
    serialization,
    cacheInfo,
  })

  if (fsCachedValue === undefined) {
    throw error
  }

  return fsCachedValue
}

// On Windows, offline errors are the same as wrong `mirror` option errors.
// Since we cannot distinguish them, we also use offline cache when `mirror`
// option is invalid.
const isOfflineError = function ({ message }) {
  return message.includes(OFFLINE_ERROR_MESSAGE)
}

const OFFLINE_ERROR_MESSAGE = 'getaddrinfo'
