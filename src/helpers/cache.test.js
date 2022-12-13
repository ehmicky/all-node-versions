import { writeFile, unlink } from 'node:fs/promises'
import { env } from 'node:process'

import globalCacheDir from 'global-cache-dir'

// We set an environment variable with mocked cached versions to be able to
// test caching.
export const setTestCache = () => {
  // eslint-disable-next-line fp/no-mutation
  env.TEST_CACHE_FILENAME = String(Math.random()).replace('.', '')
}

export const unsetTestCache = () => {
  // eslint-disable-next-line fp/no-delete
  delete env.TEST_CACHE_FILENAME
}

export const writeCacheFile = async (oldCacheFile = false) => {
  const cacheFile = await getCacheFile()
  const lastUpdate = oldCacheFile ? 0 : Date.now()
  const versionsInfo = {
    versions: [{ node: 'cached' }],
    majors: [{ major: 1, latest: 'cached' }],
  }
  const cacheContent = { lastUpdate, ...versionsInfo }
  const cacheFileContent = JSON.stringify(cacheContent, undefined, 2)

  await writeFile(cacheFile, cacheFileContent)

  return cacheFile
}

export const removeCacheFile = async () => {
  const cacheFile = await getCacheFile()
  await unlink(cacheFile)
}

const getCacheFile = async () => {
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cacheFile = `${cacheDir}/${env.TEST_CACHE_FILENAME}`
  return cacheFile
}

const CACHE_DIR = 'nve'
