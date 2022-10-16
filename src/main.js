import { env } from 'process'

import { cloneCachedVersions } from './cache/clone.js'
import { handleOfflineError } from './cache/offline.js'
import { readCachedVersions, writeCachedVersions } from './cache/read.js'
import { fetchIndex } from './fetch.js'
import { normalizeIndex } from './normalize.js'
import { getOpts } from './options.js'

// Fetch all available Node versions by making a HTTP request to Node website.
// Versions are already sorted from newest to oldest.
export default async function allNodeVersions(opts) {
  const { fetchOpt, fetchNodeOpts } = getOpts(opts)
  const versionsInfo = await getAllVersions(fetchOpt, fetchNodeOpts)
  return cloneCachedVersions(versionsInfo)
}

// We cache the HTTP request once per process.
const getAllVersions = async function (fetchOpt, fetchNodeOpts) {
  if (
    processCachedVersions !== undefined &&
    fetchOpt !== true &&
    !env.TEST_CACHE_FILENAME
  ) {
    return processCachedVersions
  }

  const versionsInfo = await getVersionsInfo(fetchOpt, fetchNodeOpts)

  // eslint-disable-next-line fp/no-mutation, require-atomic-updates
  processCachedVersions = versionsInfo

  return versionsInfo
}

// eslint-disable-next-line fp/no-let, init-declarations
let processCachedVersions

// We also cache the HTTP request for one hour using a cache file.
const getVersionsInfo = async function (fetchOpt, fetchNodeOpts) {
  const cachedVersions = await readCachedVersions(fetchOpt)
  return cachedVersions === undefined
    ? await getNewVersionsInfo(fetchNodeOpts)
    : cachedVersions
}

const getNewVersionsInfo = async function (fetchNodeOpts) {
  try {
    const index = await fetchIndex(fetchNodeOpts)
    const versionsInfo = normalizeIndex(index)
    await writeCachedVersions(versionsInfo)
    return versionsInfo
  } catch (error) {
    return handleOfflineError(error)
  }
}
