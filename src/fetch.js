import { env } from 'process'

import getCacheDir from 'cachedir'
import fetchNodeWebsite from 'fetch-node-website'
import getStream from 'get-stream'

import { moizeFs } from './cache/moize.js'

// Do the actual HTTP request
const mFetchIndex = async function ({ fetchNodeOpts }) {
  const stream = await fetchNodeWebsite(INDEX_PATH, {
    ...fetchNodeOpts,
    progress: false,
  })
  const content = await getStream(stream)
  const index = JSON.parse(content)
  return index
}

const INDEX_PATH = 'index.json'

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
// If the `fetch` option is `true`, we do not read the cache (but still write
// it)
export const fetchIndex = moizeFs(mFetchIndex, getCachePath, {
  shouldInvalidate([{ fetch }]) {
    return fetch
  },
  maxAge: MAX_AGE_MS,
  serialization: 'json',
  strict: true,
})
