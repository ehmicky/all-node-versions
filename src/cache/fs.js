import { promises as fs } from 'fs'
import { dirname } from 'path'
import { Stream } from 'stream'

import pathExists from 'path-exists'

import { writeAtomic } from './atomic.js'
import { parse, serialize } from './serialization.js'

// Cache the return value on the filesystem.
export const readFsCache = async function ({
  cachePath,
  forceRefresh,
  maxAge,
  updateAge,
  serialization,
}) {
  if (forceRefresh) {
    return { cached: false }
  }

  const [cacheContent, expireAt] = await Promise.all([
    maybeReadFile(cachePath),
    getExpireAt(cachePath),
  ])

  if (!canUseCache(cacheContent, maxAge, expireAt)) {
    return { cached: false }
  }

  const expireAtA = await maybeUpdateTimestamp(cachePath, updateAge, expireAt)

  const returnValue = parse(cacheContent, { serialization })

  if (returnValue === undefined) {
    return { cached: false }
  }

  return { returnValue, cached: true, expireAt: expireAtA }
}

const getExpireAt = async function (cachePath) {
  const timestamp = await maybeReadFile(`${cachePath}${TIMESTAMP_EXTENSION}`)

  if (timestamp === undefined) {
    return
  }

  const expireAt = new Date(Number(String(timestamp).trim()))
  return expireAt
}

const canUseCache = function (cacheContent, maxAge, expireAt) {
  return cacheContent !== undefined && isFreshCache(maxAge, expireAt)
}

const isFreshCache = function (maxAge, expireAt) {
  return (
    maxAge === Infinity ||
    (expireAt !== undefined && maxAge > Date.now() - Number(expireAt))
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
}) {
  const cacheContent = serialize(returnValue, { serialization, strict })

  if (cacheContent === undefined) {
    return { returnValue, cached: false }
  }

  await createCacheDir(cachePath)

  const [returnValueA, expireAt] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue, streams }),
    updateTimestamp(cachePath),
  ])
  return { returnValue: returnValueA, cached: true, expireAt }
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

const maybeUpdateTimestamp = function (cachePath, updateAge, expireAt) {
  if (!updateAge) {
    return expireAt
  }

  return updateTimestamp(cachePath)
}

const updateTimestamp = async function (cachePath) {
  const expireAt = new Date()
  const timestamp = `${Number(expireAt)}\n`
  await writeAtomic(`${cachePath}${TIMESTAMP_EXTENSION}`, timestamp, false)
  return expireAt
}

// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_EXTENSION = '.timestamp.txt'
