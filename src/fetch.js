import fetchNodeWebsite from 'fetch-node-website'
import getStream from 'get-stream'

// Do the actual HTTP request
export const fetchIndex = async function ({ fetchNodeOpts }) {
  const response = await fetchNodeWebsite(INDEX_PATH, {
    ...fetchNodeOpts,
    progress: false,
  })
  const content = await getStream(response)
  return content
}

const INDEX_PATH = 'index.json'
