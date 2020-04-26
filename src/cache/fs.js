import { promises as fs } from 'fs'
import { dirname } from 'path'
import { serialize, deserialize } from 'v8'

import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

// Cache the return value on the filesystem.
export const readFsCache = async function ({
  cachePath,
  timestampPath,
  useMaxAge,
  maxAge,
}) {
  const [cacheContent, isOldCache] = await Promise.all([
    maybeReadFile(cachePath),
    checkTimestamp({ timestampPath, useMaxAge, maxAge }),
  ])

  if (cacheContent === undefined || isOldCache) {
    return
  }

  const fileValue = safeDeserialize(cacheContent)
  return fileValue
}

const checkTimestamp = async function ({ timestampPath, useMaxAge, maxAge }) {
  if (!useMaxAge) {
    return false
  }

  const timestamp = await maybeReadFile(timestampPath)

  return (
    timestamp === undefined ||
    maxAge <= Date.now() - Number(String(timestamp).trim())
  )
}

const maybeReadFile = async function (path) {
  if (!(await pathExists(path))) {
    return
  }

  return fs.readFile(path)
}

// If the file is corrupted, ignore it
const safeDeserialize = function (cacheContent) {
  try {
    return deserialize(cacheContent)
  } catch {}
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
