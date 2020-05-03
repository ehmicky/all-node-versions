import fetchNodeWebsite from 'fetch-node-website'

// Do the actual HTTP request
export const fetchIndex = function ({ fetchNodeOpts }) {
  return fetchNodeWebsite(INDEX_PATH, { ...fetchNodeOpts, progress: false })
}

const INDEX_PATH = 'index.json'
