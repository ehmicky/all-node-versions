import { promises as fs } from 'fs'
import { env } from 'process'
import { serialize } from 'v8'

import globalCacheDir from 'global-cache-dir'
import pathExists from 'path-exists'

// We set an environment variable with mocked cached versions to be able to
// test caching.
export const setTestCache = function () {
  // eslint-disable-next-line fp/no-mutation
  env.TEST_CACHE_FILENAME = String(Math.random()).replace('.', '')
}

export const unsetTestCache = function () {
  // eslint-disable-next-line fp/no-delete
  delete env.TEST_CACHE_FILENAME
}

export const writeCacheFile = async function ({
  oldCacheFile = false,
  version = TEST_VERSION,
} = {}) {
  const { cachePath, timestampPath } = await getCachePath()
  const timestamp = oldCacheFile ? 0 : Date.now()
  const versionsInfo = [{ version }]
  const cacheFileContent = serialize(versionsInfo)

  await Promise.all([
    fs.writeFile(cachePath, cacheFileContent),
    fs.writeFile(timestampPath, `${timestamp}\n`),
  ])

  return cachePath
}

const TEST_VERSION = 'v1.0.0'

export const removeCacheFile = async function () {
  const { cachePath, timestampPath } = await getCachePath()
  await Promise.all([maybeUnlink(cachePath), maybeUnlink(timestampPath)])
}

const maybeUnlink = async function (path) {
  if (!(await pathExists(path))) {
    return
  }

  await fs.unlink(path)
}

const getCachePath = async function () {
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cachePathValue = `${cacheDir}/${env.TEST_CACHE_FILENAME}`
  const cachePath = `${cachePathValue}${CACHE_FILE_EXTENSION}`
  const timestampPath = `${cachePathValue}${TIMESTAMP_SUFFIX}`
  return { cachePath, timestampPath }
}

const CACHE_DIR = 'nve'
const CACHE_FILE_EXTENSION = '.v8.bin'
const TIMESTAMP_SUFFIX = '.timestamp.txt'
