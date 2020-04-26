import { env } from 'process'

import getCacheDir from 'cachedir'

import { moizeFs } from './cache/moize.js'
import { fetchIndex } from './fetch.js'
import { normalizeIndex } from './normalize.js'
import { getOpts } from './options.js'

// Fetch all available Node versions by making a HTTP request to Node website.
// Versions are already sorted from newest to oldest.
const allNodeVersions = async function (opts) {
  const { fetch, fetchNodeOpts } = getOpts(opts)
  const index = await cFetchIndex({ fetchNodeOpts, fetch })
  const versionsInfo = normalizeIndex(index)
  return versionsInfo
}

// The cache is persisted to `GLOBAL_CACHE_DIR/nve/versions.json`.
const getCachePath = function () {
  const cacheDir = getCacheDir(CACHE_DIR)
  const cacheFilename = env.TEST_CACHE_FILENAME || CACHE_FILENAME
  return `${cacheDir}/${cacheFilename}`
}

const CACHE_DIR = 'nve'
const CACHE_FILENAME = 'node_versions.json'

// One hour
const MAX_AGE_MS = 36e5

// Cache the return value on the filesystem.
// It has a TTL of one hour.
// If the `fetch` option is:
//   - `undefined`: we use the cache
//   - `false`: we use the cache even if it is old
//   - `true`: we do not use the cache
// In all three cases, we update the cache on any successful function call.
const cFetchIndex = moizeFs(fetchIndex, getCachePath, {
  shouldCacheProcess({ fetch }) {
    return fetch !== true && !env.TEST_CACHE_FILENAME
  },
  shouldCacheFile({ fetch }) {
    return fetch !== true
  },
  maxAge({ fetch }) {
    if (fetch === false) {
      return Infinity
    }

    return MAX_AGE_MS
  },
})

// We do not use `export default` because Babel transpiles it in a way that
// requires CommonJS users to `require(...).default` instead of `require(...)`.
module.exports = allNodeVersions
