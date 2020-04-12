import { env } from 'process'

import { handleOfflineError } from './cache/offline.js'
import { readCachedVersions, writeCachedVersions } from './cache/read.js'
import { fetchVersions } from './fetch.js'
import { getOpts } from './options.js'

// Fetch all available Node versions by making a HTTP request to Node website.
// Versions are already sorted from newest to oldest.
const allNodeVersions = async function (opts) {
  const { fetch, ...fetchNodeOpts } = getOpts(opts)
  const versions = await getAllVersions(fetch, fetchNodeOpts)
  return versions
}

// We cache the HTTP request once per process.
const getAllVersions = async function (fetch, fetchNodeOpts) {
  if (
    processCachedVersions !== undefined &&
    fetch !== true &&
    !env.TEST_CACHE_FILENAME
  ) {
    return processCachedVersions
  }

  const versions = await getVersions(fetch, fetchNodeOpts)

  // eslint-disable-next-line fp/no-mutation, require-atomic-updates
  processCachedVersions = versions

  return versions
}

// eslint-disable-next-line fp/no-let, init-declarations
let processCachedVersions

// We also cache the HTTP request for one hour using a cache file.
const getVersions = async function (fetch, fetchNodeOpts) {
  const cachedVersions = await readCachedVersions(fetch)

  if (cachedVersions !== undefined) {
    return cachedVersions
  }

  try {
    const versions = await fetchVersions(fetchNodeOpts)
    await writeCachedVersions(versions)
    return versions
  } catch (error) {
    return handleOfflineError(error)
  }
}

// We do not use `export default` because Babel transpiles it in a way that
// requires CommonJS users to `require(...).default` instead of `require(...)`.
module.exports = allNodeVersions
