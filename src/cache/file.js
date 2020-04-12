import { promises as fs } from 'fs'
import { env } from 'process'

import globalCacheDir from 'global-cache-dir'
import writeFileAtomic from 'write-file-atomic'

// The cache is persisted to `GLOBAL_CACHE_DIR/nve/versions.json`.
export const getCacheFile = async function () {
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cacheFilename = env.TEST_CACHE_FILENAME || CACHE_FILENAME
  return `${cacheDir}/${cacheFilename}`
}

const CACHE_DIR = 'nve'
const CACHE_FILENAME = 'versions.json'

// Retrieve cache file's content
export const getCacheFileContent = async function (cacheFile) {
  const cacheFileContent = await fs.readFile(cacheFile, 'utf8')
  const { lastUpdate, versions } = JSON.parse(cacheFileContent)
  const age = Date.now() - lastUpdate
  return { versions, age }
}

// Persist cache file's content
export const setCacheFileContent = async function (cacheFile, versions) {
  const lastUpdate = Date.now()
  const cacheContent = { lastUpdate, versions }
  const cacheFileContent = `${JSON.stringify(cacheContent, null, 2)}\n`

  try {
    await writeFileAtomic(cacheFile, cacheFileContent)
    // If two different functions are calling `normalize-node-version` at the
    // same time and there's no cache file, they will both try to persist the
    // file and one might fail, especially on Windows (with EPERM lock file
    // errors)
  } catch {}
}
