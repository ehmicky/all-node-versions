import allNodeVersions from '../../src/main.js'

// Retrieve latest Node.js version
export const getLatestVersion = async function (opts) {
  const {
    versions: [version],
  } = await allNodeVersions(opts)
  return version
}
