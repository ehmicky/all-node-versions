import { promises as fs } from 'fs'
import { dirname } from 'path'
import { Readable } from 'stream'

import pathExists from 'path-exists'

import { writeAtomic } from './atomic.js'
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
    return returnValue
  }

  await createCacheDir(cachePath)

  const [returnValueA] = await Promise.all([
    writeContent({ cachePath, cacheContent, returnValue }),
    writeAtomic(`${cachePath}${TIMESTAMP_EXTENSION}`, timestamp),
  ])
  return returnValueA
}

const createCacheDir = async function (cachePath) {
  const cacheDir = dirname(cachePath)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}

const writeContent = async function ({ cachePath, cacheContent, returnValue }) {
  const returnValueA = await writeAtomic(cachePath, cacheContent)

  if (cacheContent instanceof Readable) {
    return returnValueA
  }

  return returnValue
}

// We store the timestamp as a sibling file and use it to calculate cache age
const TIMESTAMP_EXTENSION = '.timestamp.txt'
