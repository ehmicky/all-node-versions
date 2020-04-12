import fetchNodeWebsite from 'fetch-node-website'
import getStream from 'get-stream'

// Do the actual HTTP request
export const fetchVersions = async function (fetchNodeOpts) {
  const response = await fetchNodeWebsite(INDEX_PATH, {
    ...fetchNodeOpts,
    progress: false,
  })
  const content = await getStream(response)
  const index = JSON.parse(content)
  const versions = index.map(getVersionField)
  return versions
}

const INDEX_PATH = 'index.json'

const getVersionField = function ({ version }) {
  // Remove the leading `v`
  return version.slice(1)
}
