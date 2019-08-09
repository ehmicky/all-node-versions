import { fetchUrl } from './fetch.js'

// Fetch all available Node versions by making a HTTP request to Node website
// Versions are already sorted from newest to oldest
const allNodeVersions = async function() {
  const response = await fetchUrl(INDEX_PATH)
  const index = await response.json()
  const versions = index.map(getVersionField)
  return versions
}

const INDEX_PATH = 'index.json'

const getVersionField = function({ version }) {
  // Remove the leading `v`
  return version.slice(1)
}

// We do not use `export default` because Babel transpiles it in a way that
// requires CommonJS users to `require(...).default` instead of `require(...)`.
module.exports = allNodeVersions
