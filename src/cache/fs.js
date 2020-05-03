import { promises as fs } from 'fs'
import { dirname } from 'path'

import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

import { parse, serialize } from './serialization.js'

// Cache the return value on the filesystem.
export const readFsCache = async function ({
  cachePath,
  useMaxAge,
  maxAge,
  serialization,
}) {
  const [cacheContent, isOldCache] = await Promise.all([
    maybeReadFile(cachePath),
    checkTimestamp({ cachePath, useMaxAge, maxAge }),
  ])

  if (cacheContent === undefined || isOldCache) {
    return
  }

  const fileValue = parse(cacheContent, { serialization })
  return fileValue
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
}) {
  const timestamp = `${Date.now()}\n`
  const cacheContent = serialize(returnValue, { serialization, strict })

  if (cacheContent === undefined) {
    return
  }

  await createCacheDir(cachePath)

  try {
    await Promise.all([
      writeFileAtomic(cachePath, cacheContent),
      writeFileAtomic(`${cachePath}${TIMESTAMP_EXTENSION}`, timestamp),
    ])
    // If two different functions are calling `normalize-node-version` at the
    // same time and there's no cache file, they will both try to persist the
    // file and one might fail, especially on Windows (with EPERM lock file
    // errors)
  } catch {}
}

const createCacheDir = async function (cachePath) {
  const cacheDir = dirname(cachePath)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}

// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_EXTENSION = '.timestamp.txt'
