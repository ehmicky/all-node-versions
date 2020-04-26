import { promises as fs } from 'fs'
import { dirname } from 'path'
import { serialize, deserialize } from 'v8'

import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

// Cache the return value on the filesystem.
// It has a TTL of one hour.
// If the `fetch` option is:
//   - `undefined`: we use the cache
//   - `false`: we use the cache even if it is old
//   - `true`: we do not use the cache
// In all three cases, we update the cache on any successful function call.
export const readFsCache = async function ({
  cachePath,
  timestampPath,
  args,
  maxAge,
}) {
  const [cacheFileContent, timestamp] = await Promise.all([
    maybeReadFile(cachePath),
    maybeReadFile(timestampPath),
  ])

  if (cacheFileContent === undefined || timestamp === undefined) {
    return
  }

  return getCachedValue({ cacheFileContent, timestamp, args, maxAge })
}

const maybeReadFile = async function (path) {
  if (!(await pathExists(path))) {
    return
  }

  return fs.readFile(path)
}

const getCachedValue = function ({
  cacheFileContent,
  timestamp,
  args,
  maxAge,
}) {
  const returnValue = safeDeserialize(cacheFileContent)

  if (returnValue === undefined) {
    return
  }

  const age = Date.now() - Number(String(timestamp).trim())

  if (age > getMaxAge(maxAge, args)) {
    return
  }

  return returnValue
}

// If the file is corrupted, ignore it
const safeDeserialize = function (cacheFileContent) {
  try {
    return deserialize(cacheFileContent)
  } catch {}
}

const getMaxAge = function (maxAge, args) {
  if (typeof maxAge !== 'function') {
    return maxAge
  }

  return maxAge(...args)
}

// Persist the file cache
export const writeFsCache = async function ({
  cachePath,
  timestampPath,
  returnValue,
  strict,
}) {
  const timestamp = `${Date.now()}\n`
  const cacheFileContent = trySerialize(returnValue, strict)

  if (cacheFileContent === undefined) {
    return
  }

  await createCacheDir(cachePath)

  try {
    await Promise.all([
      writeFileAtomic(cachePath, cacheFileContent),
      writeFileAtomic(timestampPath, timestamp),
    ])
    // If two different functions are calling `normalize-node-version` at the
    // same time and there's no cache file, they will both try to persist the
    // file and one might fail, especially on Windows (with EPERM lock file
    // errors)
  } catch {}
}

const trySerialize = function (returnValue, strict) {
  try {
    return serialize(returnValue)
  } catch (error) {
    handleSerializeError(error, strict)
  }
}

const handleSerializeError = function (error, strict) {
  if (!strict) {
    return
  }

  // eslint-disable-next-line no-param-reassign, fp/no-mutation
  error.message = `Could not cache the return value: not serializable with the structured cloned algorithm\n${error.message}`
  throw error
}

const createCacheDir = async function (cachePath) {
  const cacheDir = dirname(cachePath)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}
