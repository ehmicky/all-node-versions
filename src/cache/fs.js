import { promises as fs } from 'fs'
import { dirname } from 'path'
import { serialize, deserialize } from 'v8'

import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

// Cache the return value on the filesystem.
export const readFsCache = async function ({
  cachePath,
  timestampPath,
  args,
  useMaxAge,
  maxAge,
}) {
  const [cacheContent, timestamp] = await Promise.all([
    maybeReadFile(cachePath),
    maybeReadFile(timestampPath),
  ])

  if (cacheContent === undefined || timestamp === undefined) {
    return
  }

  return getCachedValue({ cacheContent, timestamp, args, useMaxAge, maxAge })
}

const maybeReadFile = async function (path) {
  if (!(await pathExists(path))) {
    return
  }

  return fs.readFile(path)
}

const getCachedValue = function ({
  cacheContent,
  timestamp,
  args,
  useMaxAge,
  maxAge,
}) {
  const returnValue = safeDeserialize(cacheContent)

  if (
    returnValue === undefined ||
    isOldCache({ timestamp, args, useMaxAge, maxAge })
  ) {
    return
  }

  return returnValue
}

// If the file is corrupted, ignore it
const safeDeserialize = function (cacheContent) {
  try {
    return deserialize(cacheContent)
  } catch {}
}

const isOldCache = function ({ timestamp, args, useMaxAge, maxAge }) {
  return (
    useMaxAge(...args) &&
    maxAge <= Date.now() - Number(String(timestamp).trim())
  )
}

// Persist the file cache
export const writeFsCache = async function ({
  cachePath,
  timestampPath,
  returnValue,
  strict,
}) {
  const timestamp = `${Date.now()}\n`
  const cacheContent = trySerialize(returnValue, strict)

  if (cacheContent === undefined) {
    return
  }

  await createCacheDir(cachePath)

  try {
    await Promise.all([
      writeFileAtomic(cachePath, cacheContent),
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
