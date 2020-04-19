import { promises as fs } from 'fs'

// Retrieve cache file's content
export const getCacheFileContent = async function (cachePath) {
  const cacheFileContent = await fs.readFile(cachePath, 'utf8')
  const { lastUpdate, ...versionsInfo } = JSON.parse(cacheFileContent)
  const age = Date.now() - lastUpdate
  return { versionsInfo, age }
}
