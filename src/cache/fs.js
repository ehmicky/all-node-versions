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
    return {}
  }

  const [cacheContent, expireAt] = await Promise.all([
    maybeReadFile(cachePath),
    getExpireAt(cachePath),
  ])

  if (!canUseCache(cacheContent, useMaxAge, expireAt)) {
    return {}
  }

  const expireAtA = await maybeUpdateExpireAt({
    cachePath,
    updateAge,
    expireAt,
    maxAge,
    useMaxAge,
  })

  const returnValue = parse(cacheContent, { serialization })

  if (returnValue === undefined) {
    return {}
  }

  return { returnValue, state: 'file', expireAt: expireAtA }
}

const getExpireAt = async function (cachePath) {
  const expireAtString = await maybeReadFile(`${cachePath}${EXPIRE_EXTENSION}`)

  if (expireAtString === undefined) {
    return
  }

  const expireAt = Number(String(expireAtString).trim())

  if (Number.isNaN(expireAt)) {
    return
  }

  return expireAt
}

const canUseCache = function (cacheContent, useMaxAge, expireAt) {
  return cacheContent !== undefined && isFreshCache(useMaxAge, expireAt)
}

const isFreshCache = function (useMaxAge, expireAt) {
  return !useMaxAge || (expireAt !== undefined && expireAt > Date.now())
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
  maxAge,
  serialization,
  strict,
  streams,
}) {
  const cacheContent = serialize(returnValue, { serialization, strict })

  if (cacheContent === undefined) {
    return { returnValue, state: 'error' }
  }

  await createCacheDir(cachePath)

  const [returnValueA, expireAt] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue, streams }),
    updateExpireAt(cachePath, maxAge),
  ])
  return { returnValue: returnValueA, state: 'new', expireAt }
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
  maxAge,
  useMaxAge,
}) {
  if (!updateAge || !useMaxAge) {
    return expireAt
  }

  return updateExpireAt(cachePath, maxAge)
}

const updateExpireAt = async function (cachePath, maxAge) {
  const expireAt = Math.round(
    Math.min(Date.now() + maxAge, Number.MAX_SAFE_INTEGER),
  )
  await writeAtomic(`${cachePath}${EXPIRE_EXTENSION}`, `${expireAt}\n`, false)
  return expireAt
}

// We store the expire time as a sibling file and use it to calculate cache age.
// We cannot use a real mtime since some partitions and OS do not reliably
// store it.
const EXPIRE_EXTENSION = '.expire.txt'
