import { promises as fs } from 'fs'
import { dirname } from 'path'
import { env } from 'process'

import getCacheDir from 'cachedir'
import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

// The cache is persisted to `GLOBAL_CACHE_DIR/nve/versions.json`.
export const getCacheFile = function () {
  const cacheDir = getCacheDir(CACHE_DIR)
  const cacheFilename = env.TEST_CACHE_FILENAME || CACHE_FILENAME
  return `${cacheDir}/${cacheFilename}`
}

const CACHE_DIR = 'nve'
const CACHE_FILENAME = 'versions.json'

// Retrieve cache file's content
export const getCacheFileContent = async function (cacheFile) {
  const cacheFileContent = await fs.readFile(cacheFile, 'utf8')
  const { lastUpdate, ...versionsInfo } = JSON.parse(cacheFileContent)
  const age = Date.now() - lastUpdate
  return { versionsInfo, age }
}

// Persist cache file's content
export const setCacheFileContent = async function (cacheFile, versionsInfo) {
  const lastUpdate = Date.now()
  const cacheContent = { lastUpdate, ...versionsInfo }
  const cacheFileContent = `${JSON.stringify(cacheContent, undefined, 2)}\n`

  try {
    await createCacheDir(cacheFile)
    await writeFileAtomic(cacheFile, cacheFileContent)
    // If two different functions are calling `normalize-node-version` at the
    // same time and there's no cache file, they will both try to persist the
    // file and one might fail, especially on Windows (with EPERM lock file
    // errors)
  } catch {}
}

const createCacheDir = async function (cacheFile) {
  const cacheDir = dirname(cacheFile)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}
