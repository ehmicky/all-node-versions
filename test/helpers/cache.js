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

export const writeCacheFile = async function (oldCacheFile = false) {
  const cachePath = await getCachePath()
  const timestamp = oldCacheFile ? 0 : Date.now()
  const versionsInfo = {
    versions: ['cached'],
    majors: [{ major: 1, latest: 'cached' }],
  }
  const cacheFileContent = JSON.stringify(versionsInfo, undefined, 2)

  await Promise.all([
    fs.writeFile(cachePath, cacheFileContent),
    fs.writeFile(`${cachePath}${TIMESTAMP_SUFFIX}`, `${timestamp}\n`),
  ])

  return cachePath
}

export const removeCacheFile = async function () {
  const cachePath = await getCachePath()
  await Promise.all([
    maybeUnlink(cachePath),
    maybeUnlink(`${cachePath}${TIMESTAMP_SUFFIX}`),
  ])
}

const maybeUnlink = async function (path) {
  if (!(await pathExists(path))) {
    return
  }

  await fs.unlink(path)
}

const getCachePath = async function () {
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cacheFile = `${cacheDir}/${env.TEST_CACHE_FILENAME}`
  return cacheFile
}

const CACHE_DIR = 'nve'
const TIMESTAMP_SUFFIX = '.timestamp.txt'
