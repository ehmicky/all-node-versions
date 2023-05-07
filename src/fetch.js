import { json } from 'node:stream/consumers'

import fetchNodeWebsite from 'fetch-node-website'

// Do the actual HTTP request
export const fetchIndex = async (fetchNodeOpts) => {
  const response = await fetchNodeWebsite(INDEX_PATH, {
    ...fetchNodeOpts,
    progress: false,
  })
  const index = await json(response)
  return index
}

const INDEX_PATH = 'index.json'
