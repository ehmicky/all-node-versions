import { readFile } from 'node:fs/promises'
import { env } from 'node:process'

import globalCacheDir from 'global-cache-dir'
import writeFileAtomic from 'write-file-atomic'

// The cache is persisted to `GLOBAL_CACHE_DIR/nve/versions_${VERSION}.json`.
export const getCacheFile = async () => {
  const cacheDir = await globalCacheDir(CACHE_DIR)
  const cacheFilename = env.TEST_CACHE_FILENAME || CACHE_FILENAME
  return `${cacheDir}/${cacheFilename}`
}

const CACHE_DIR = 'nve'
// `VERSION` number should be incremented when `all-node-versions` return value
// has breaking changes.
const CACHE_FILENAME = 'versions_2.json'

// Retrieve cache file's content
export const getCacheFileContent = async (cacheFile) => {
  const cacheFileContent = await readFile(cacheFile)
  const { lastUpdate, ...versionsInfo } = JSON.parse(cacheFileContent)
  const age = Date.now() - lastUpdate
  return { versionsInfo, age }
}

// Persist cache file's content
export const setCacheFileContent = async (cacheFile, versionsInfo) => {
  const lastUpdate = Date.now()
  const cacheContent = { lastUpdate, ...versionsInfo }
  const cacheFileContent = `${JSON.stringify(cacheContent, undefined, 2)}\n`

  try {
    await writeFileAtomic(cacheFile, cacheFileContent)
    // If two different functions are calling `normalize-node-version` at the
    // same time and there's no cache file, they will both try to persist the
    // file and one might fail, especially on Windows (with EPERM lock file
    // errors)
  } catch {}
}
