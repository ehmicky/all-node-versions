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
    maybeReadFile(cachePath),
    checkTimestamp({ cachePath, useMaxAge, maxAge }),
  ])

  if (cacheContent === undefined || isOldCache) {
    return addCacheInfo({ cacheInfo })
  }

  await maybeUpdateTimestamp(cachePath, updateAge)

  const returnValue = parse(cacheContent, { serialization })
  const fsCachedValue = addCacheInfo({ cacheInfo, returnValue, cachePath })
  return fsCachedValue
}

const checkTimestamp = async function ({ cachePath, useMaxAge, maxAge }) {
  if (!useMaxAge) {
    return false
  }

  const timestamp = await maybeReadFile(`${cachePath}${TIMESTAMP_EXTENSION}`)

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
    return addCacheInfo({ cacheInfo, returnValue })
  }

  await createCacheDir(cachePath)

  const [returnValueA] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue, streams }),
    updateTimestamp(cachePath),
  ])
  return addCacheInfo({ cacheInfo, returnValue: returnValueA, cachePath })
}

const addCacheInfo = function ({ cacheInfo, returnValue, cachePath }) {
  if (cacheInfo) {
    return cachePath
  }

  return returnValue
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
