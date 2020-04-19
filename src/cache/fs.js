import pathExists from 'path-exists'

import {
  getCacheFile,
  getCacheFileContent,
  setCacheFileContent,
} from './file.js'

// Cache the return value on the filesystem.
// It has a TTL of one hour.
// If the `fetch` option is:
//   - `undefined`: we use the cache
//   - `false`: we use the cache even if it is old
//   - `true`: we do not use the cache
// In all three cases, we update the cache on any successful function call.
export const readFsCache = async function (fetch) {
  if (fetch === true) {
    return
  }

  const cacheFile = await getCacheFile()

  if (!(await pathExists(cacheFile))) {
    return
  }

  const { versionsInfo, age } = await getCacheFileContent(cacheFile)

  if (isOldCache(age, fetch)) {
    return
  }

  return versionsInfo
}

const isOldCache = function (age, fetch) {
  return age > MAX_AGE_MS && fetch !== false
}

// One hour
const MAX_AGE_MS = 36e5

// Persist the file cache
export const writeFsCache = async function (versionsInfo) {
  const cacheFile = await getCacheFile()
  await setCacheFileContent(cacheFile, versionsInfo)
}
