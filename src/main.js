import { moizeFs } from './cache/moize.js'
import { fetchIndex } from './fetch.js'
import { normalizeIndex } from './normalize.js'
import { getOpts } from './options.js'

// Fetch all available Node versions by making a HTTP request to Node website.
// Versions are already sorted from newest to oldest.
const allNodeVersions = async function (opts) {
  const { fetch, fetchNodeOpts } = getOpts(opts)
  const versionsInfo = await cGetIndex({ ...fetchNodeOpts, fetch })
  return versionsInfo
}

const getIndex = async function (fetchNodeOpts) {
  const index = await fetchIndex(fetchNodeOpts)
  const versionsInfo = normalizeIndex(index)
  return versionsInfo
}

const cGetIndex = moizeFs(getIndex)

// We do not use `export default` because Babel transpiles it in a way that
// requires CommonJS users to `require(...).default` instead of `require(...)`.
module.exports = allNodeVersions
