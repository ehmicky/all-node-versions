import { promises as fs } from 'fs'
import { dirname } from 'path'

import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

// Cache the return value on the filesystem.
// It has a TTL of one hour.
// If the `fetch` option is:
//   - `undefined`: we use the cache
//   - `false`: we use the cache even if it is old
//   - `true`: we do not use the cache
// In all three cases, we update the cache on any successful function call.
export const readFsCache = async function (cachePath, fetch) {
  if (fetch === true) {
    return
  }

  if (!(await pathExists(cachePath))) {
    return
  }

  const { versionsInfo, age } = await getCacheFileContent(cachePath)

  if (isOldCache(age, fetch)) {
    return
  }

  return versionsInfo
}

// Retrieve cache file's content
const getCacheFileContent = async function (cachePath) {
  const cacheFileContent = await fs.readFile(cachePath, 'utf8')
  const { lastUpdate, ...versionsInfo } = JSON.parse(cacheFileContent)
  const age = Date.now() - lastUpdate
  return { versionsInfo, age }
}

const isOldCache = function (age, fetch) {
  const maxAge = maxAgeOption(fetch)
  return age > maxAge
}

const maxAgeOption = function (fetch) {
  if (fetch === false) {
    return Infinity
  }

  return MAX_AGE_MS
}

// One hour
const MAX_AGE_MS = 36e5

// Persist the file cache
export const writeFsCache = async function (cachePath, versionsInfo) {
  const lastUpdate = Date.now()
  const cacheContent = { lastUpdate, ...versionsInfo }
  const cacheFileContent = `${JSON.stringify(cacheContent, undefined, 2)}\n`

  try {
    await createCacheDir(cachePath)
    await writeFileAtomic(cachePath, cacheFileContent)
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
