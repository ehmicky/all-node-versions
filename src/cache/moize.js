import { env } from 'process'

import { handleOfflineError } from './offline.js'
import { readCachedVersions, writeCachedVersions } from './read.js'

export const moizeFs = function (func) {
  const state = {}

  return function moizedFsFunction(...args) {
    return getAllVersions(func, args, state)
  }
}

// We cache the HTTP request once per process.
const getAllVersions = async function (func, args, state) {
  const { fetch, args: argsA } = getFetchOption(args)

  if (
    state.processCachedVersions !== undefined &&
    fetch !== true &&
    !env.TEST_CACHE_FILENAME
  ) {
    return state.processCachedVersions
  }

  const versionsInfo = await getVersionsInfo(func, fetch, argsA)

  // eslint-disable-next-line fp/no-mutation, require-atomic-updates, no-param-reassign
  state.processCachedVersions = versionsInfo

  return versionsInfo
}

const getFetchOption = function ([{ fetch, ...arg }, ...argsA]) {
  return { fetch, args: [arg, ...argsA] }
}

// We also cache the HTTP request for one hour using a cache file.
const getVersionsInfo = async function (func, fetch, args) {
  const cachedVersions = await readCachedVersions(fetch)

  if (cachedVersions !== undefined) {
    return cachedVersions
  }

  try {
    const versionsInfo = await func(...args)
    await writeCachedVersions(versionsInfo)
    return versionsInfo
  } catch (error) {
    return handleOfflineError(error)
  }
}
