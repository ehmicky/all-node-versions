import fetchNodeWebsite from 'fetch-node-website'
import getStream from 'get-stream'

// Fetch all available Node versions by making a HTTP request to Node website
// Versions are already sorted from newest to oldest
const allNodeVersions = async function(opts) {
  const response = await fetchNodeWebsite(INDEX_PATH, opts)
  const content = await getStream(response)
  const index = JSON.parse(content)
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
