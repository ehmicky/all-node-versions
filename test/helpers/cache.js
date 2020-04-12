import { promises as fs } from 'fs'
import { env } from 'process'

import globalCacheDir from 'global-cache-dir'

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
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cacheFile = `${cacheDir}/${env.TEST_CACHE_FILENAME}`
  const lastUpdate = oldCacheFile ? 0 : Date.now()
  const versions = ['cached']
  const cacheContent = { lastUpdate, versions }
  const cacheFileContent = JSON.stringify(cacheContent, null, 2)

  await fs.writeFile(cacheFile, cacheFileContent)

  return cacheFile
}

const CACHE_DIR = 'nve'
