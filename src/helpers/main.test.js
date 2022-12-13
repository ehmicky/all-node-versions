import allNodeVersions from 'all-node-versions'

// Retrieve latest Node.js version
export const getLatestVersion = async (opts) => {
  const {
    versions: [{ node }],
  } = await allNodeVersions(opts)
  return node
}
