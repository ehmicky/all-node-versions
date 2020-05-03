import { promises as fs } from 'fs'
import { dirname } from 'path'
import { Stream } from 'stream'

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
  cacheInfo,
}) {
  const [cacheContent, isOldCache] = await Promise.all([
    maybeReadFile(cachePath, cacheInfo),
    checkTimestamp({ cachePath, useMaxAge, maxAge }),
  ])

  if (cacheContent === undefined || isOldCache) {
    return
  }

  await maybeUpdateTimestamp(cachePath, updateAge)

  if (cacheInfo) {
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

const maybeReadFile = async function (path, cacheInfo) {
  if (!(await pathExists(path))) {
    return
  }

  if (cacheInfo) {
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
  cacheInfo,
}) {
  const cacheContent = serialize(returnValue, { serialization, strict })

  if (cacheContent === undefined) {
    return cacheInfo ? undefined : returnValue
  }

  await createCacheDir(cachePath)

  const [returnValueA] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue, streams }),
    updateTimestamp(cachePath),
  ])
  return cacheInfo ? cachePath : returnValueA
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

  if (cacheContent instanceof Stream) {
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
