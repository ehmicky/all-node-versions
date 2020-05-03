import { promises as fs } from 'fs'
import { env } from 'process'

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
  const { cachePath, expireAtPath } = await getCachePath()
  const expireAt = oldCacheFile ? Date.now() - 1 : Number.MAX_SAFE_INTEGER
  const versionsInfo = [{ version }]
  const cacheFileContent = JSON.stringify(versionsInfo, undefined, 2)

  await Promise.all([
    fs.writeFile(cachePath, cacheFileContent),
    fs.writeFile(expireAtPath, `${expireAt}\n`),
  ])
}

const TEST_VERSION = 'v1.0.0'

export const removeCacheFile = async function () {
  const { cachePath, expireAtPath } = await getCachePath()
  await Promise.all([maybeUnlink(cachePath), maybeUnlink(expireAtPath)])
}

const maybeUnlink = async function (path) {
  if (!(await pathExists(path))) {
    return
  }

  await fs.unlink(path)
}

const getCachePath = async function () {
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cachePath = `${cacheDir}/${env.TEST_CACHE_FILENAME}`
  const expireAtPath = `${cachePath}${EXPIRE_SUFFIX}`
  return { cachePath, expireAtPath }
}

const CACHE_DIR = 'nve'
const EXPIRE_SUFFIX = '.expire.txt'
