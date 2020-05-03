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
  useMaxAge,
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

  if (!canUseCache(cacheContent, useMaxAge, maxAge, expireAt)) {
    return { cached: false }
  }

  const expireAtA = await maybeUpdateExpireAt({
    cachePath,
    updateAge,
    expireAt,
    useMaxAge,
  })

  const returnValue = parse(cacheContent, { serialization })

  if (returnValue === undefined) {
    return { cached: false }
  }

  return { returnValue, cached: true, expireAt: expireAtA }
}

const getExpireAt = async function (cachePath) {
  const expireAt = await maybeReadFile(`${cachePath}${EXPIRE_EXTENSION}`)

  if (expireAt === undefined) {
    return
  }

  return new Date(Number(String(expireAt).trim()))
}

const canUseCache = function (cacheContent, useMaxAge, maxAge, expireAt) {
  return cacheContent !== undefined && isFreshCache(useMaxAge, maxAge, expireAt)
}

const isFreshCache = function (useMaxAge, maxAge, expireAt) {
  return (
    !useMaxAge ||
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
    updateExpireAt(cachePath),
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

const maybeUpdateExpireAt = function ({
  cachePath,
  updateAge,
  expireAt,
  useMaxAge,
}) {
  if (!updateAge || !useMaxAge) {
    return expireAt
  }

  return updateExpireAt(cachePath)
}

const updateExpireAt = async function (cachePath) {
  const expireAt = new Date()
  const timestamp = Number(expireAt)
  await writeAtomic(`${cachePath}${EXPIRE_EXTENSION}`, `${timestamp}\n`, false)
  return expireAt
}

// We store the expire time as a sibling file and use it to calculate cache age.
// We cannot use a real mtime since some partitions and OS do not reliably
// store it.
const EXPIRE_EXTENSION = '.expire.txt'
