import { promises as fs } from 'fs'
import { dirname } from 'path'

import pathExists from 'path-exists'
import writeFileAtomic from 'write-file-atomic'

// Retrieve cache file's content
export const getCacheFileContent = async function (cachePath) {
  const cacheFileContent = await fs.readFile(cachePath, 'utf8')
  const { lastUpdate, ...versionsInfo } = JSON.parse(cacheFileContent)
  const age = Date.now() - lastUpdate
  return { versionsInfo, age }
}

// Persist cache file's content
export const setCacheFileContent = async function (cachePath, versionsInfo) {
  const lastUpdate = Date.now()
  const cacheContent = { lastUpdate, ...versionsInfo }
  const cacheFileContent = `${JSON.stringify(cacheContent, undefined, 2)}\n`

  try {
    await createCacheDir(cachePath)
    await writeFileAtomic(cachePath, cacheFileContent)
    // If two different functions are calling `normalize-node-version` at the
    // same time and there's no cache file, they will both try to persist the
    // file and one might fail, especially on Windows (with EPERM lock file
    // errors)
  } catch {}
}

const createCacheDir = async function (cachePath) {
  const cacheDir = dirname(cachePath)

  if (await pathExists(cacheDir)) {
    return
  }

  await fs.mkdir(cacheDir, { recursive: true })
}
