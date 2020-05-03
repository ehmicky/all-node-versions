import { promises as fs, createReadStream } from 'fs'
import { dirname } from 'path'
import { Stream } from 'stream'

import pathExists from 'path-exists'

import { writeAtomic } from './atomic.js'
import { parse, serialize } from './serialization.js'

// Cache the return value on the filesystem.
export const readFsCache = async function ({
  cachePath,
  invalidate,
  serialization,
  streamOpt,
  offline,
}) {
  if (invalidate) {
    return {}
  }

  const [cacheContent, expireAt] = await Promise.all([
    maybeReadFile(cachePath, streamOpt),
    getExpireAt(cachePath),
  ])

  if (!canUseCache(cacheContent, offline, expireAt)) {
    return {}
  }

  const returnValue = parse(cacheContent, { serialization })

  if (returnValue === undefined) {
    return {}
  }

  return { returnValue, state: 'file', path: cachePath, expireAt }
}

const getExpireAt = async function (cachePath) {
  const expireAtString = await maybeReadFile(
    `${cachePath}${EXPIRE_EXTENSION}`,
    false,
  )

  if (expireAtString === undefined) {
    return
  }

  const expireAt = Number(String(expireAtString).trim())

  if (Number.isNaN(expireAt)) {
    return
  }

  return expireAt
}

const canUseCache = function (cacheContent, offline, expireAt) {
  return cacheContent !== undefined && (offline || isFreshCache(expireAt))
}

const isFreshCache = function (expireAt) {
  return expireAt !== undefined && expireAt > Date.now()
}

const maybeReadFile = async function (path, streamOpt) {
  if (!(await pathExists(path))) {
    return
  }

  if (streamOpt) {
    return createReadStream(path)
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
  streamOpt,
}) {
  validateStreamOpt(returnValue, streamOpt)

  const cacheContent = serialize(returnValue, { serialization, strict })

  if (cacheContent === undefined) {
    return { returnValue, state: 'error' }
  }

  await createCacheDir(cachePath)

  const [returnValueA, expireAt] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue }),
    setExpireAt(cachePath, maxAge),
  ])
  return { returnValue: returnValueA, state: 'new', path: cachePath, expireAt }
}

const validateStreamOpt = function (returnValue, streamOpt) {
  if (returnValue instanceof Stream) {
    // eslint-disable-next-line max-depth
    if (!streamOpt) {
      throw new TypeError(
        'Must return use the "stream" option to return a stream',
      )
    }

    return
  }

  if (streamOpt) {
    throw new TypeError('Must return a stream when using the "stream" option')
  }
}

const createCacheDir = async function (cachePath) {
  const cacheDir = dirname(cachePath)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}

const writeContent = async function ({ cachePath, cacheContent, returnValue }) {
  const returnStream = await writeAtomic(cachePath, cacheContent)

  if (returnStream !== undefined) {
    return returnStream
  }

  return returnValue
}

// Refresh `expireAt` file on cache hit when using `expireAt`. Called outside
// of the process-memoized function because a process-cache hit should keep
// the file cache in sync.
// Should happen on process|file cache hit only, which is checked with
// `expireAt === undefined`.
// Notably, this should not happen when:
//  - offline: the `expireAt` file is outdated and should be removed once online
//  - error: no file has been cached
// This works even if those have been process-cached (i.e. `state` might be
// `process`).
// We also don't refresh when `new` because the `expireAt` has just been set,
// so it would be a noop.
export const refreshFileExpireAt = function ({
  cachePath,
  updateExpire,
  expireAt,
  maxAge,
  state,
}) {
  if (!updateExpire || expireAt === undefined || state === 'new') {
    return expireAt
  }

  return setExpireAt(cachePath, maxAge)
}

const setExpireAt = async function (cachePath, maxAge) {
  const expireAt = Math.round(
    Math.min(Date.now() + maxAge, Number.MAX_SAFE_INTEGER),
  )
  await writeAtomic(`${cachePath}${EXPIRE_EXTENSION}`, `${expireAt}\n`)
  return expireAt
}

// We store the expire time as a sibling file and use it to calculate cache age.
// We cannot use a real mtime since some partitions and OS do not reliably
// store it.
const EXPIRE_EXTENSION = '.expire.txt'
