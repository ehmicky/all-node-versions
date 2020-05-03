import { promises as fs } from 'fs'
import { dirname } from 'path'

import pathExists from 'path-exists'

import { writeAtomic } from './atomic.js'
import { parse, serialize } from './serialization.js'

// Cache the return value on the filesystem.
export const readFsCache = async function ({
  cachePath,
  useMaxAge,
  maxAge,
  updateAge,
  serialization,
  returnCachePath,
}) {
  const [cacheContent, isOldCache] = await Promise.all([
    maybeReadFile(cachePath, returnCachePath),
    checkTimestamp({ cachePath, useMaxAge, maxAge }),
  ])

  if (cacheContent === undefined || isOldCache) {
    return
  }

  await maybeUpdateTimestamp(cachePath, updateAge)

  if (returnCachePath) {
    return cacheContent
  }

  const fileValue = parse(cacheContent, { serialization })
  return fileValue
}

const checkTimestamp = async function ({ cachePath, useMaxAge, maxAge }) {
  if (!useMaxAge) {
    return false
  }

  const timestamp = await maybeReadFile(
    `${cachePath}${TIMESTAMP_EXTENSION}`,
    false,
  )

  return (
    timestamp === undefined ||
    maxAge <= Date.now() - Number(String(timestamp).trim())
  )
}

const maybeReadFile = async function (path, returnCachePath) {
  if (!(await pathExists(path))) {
    return
  }

  if (returnCachePath) {
    return path
  }

  return fs.readFile(path)
}

// Persist the file cache
export const writeFsCache = async function ({
  cachePath,
  returnValue,
  serialization,
  strict,
  streams,
  returnCachePath,
}) {
  const cacheContent = serialize(returnValue, { serialization, strict })

  if (cacheContent === undefined) {
    return returnCachePath ? undefined : returnValue
  }

  await createCacheDir(cachePath)

  const [returnValueA] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue, streams }),
    updateTimestamp(cachePath),
  ])
  return returnCachePath ? cachePath : returnValueA
}

const createCacheDir = async function (cachePath) {
  const cacheDir = dirname(cachePath)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}

const writeContent = async function ({
  cachePath,
  cacheContent,
  returnValue,
  streams,
}) {
  const streamContent = await writeAtomic(cachePath, cacheContent, streams)

  if (streamContent !== undefined) {
    return streamContent
  }

  return returnValue
}

const maybeUpdateTimestamp = async function (cachePath, updateAge) {
  if (!updateAge) {
    return
  }

  await updateTimestamp(cachePath)
}

const updateTimestamp = async function (cachePath) {
  const timestamp = `${Date.now()}\n`
  await writeAtomic(`${cachePath}${TIMESTAMP_EXTENSION}`, timestamp, false)
}

// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_EXTENSION = '.timestamp.txt'
