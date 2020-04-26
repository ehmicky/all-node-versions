import test from 'ava'
import { each } from 'test-each'

import {
  setTestCache,
  unsetTestCache,
  writeCacheFile,
  removeCacheFile,
} from './helpers/cache.js'
import { getLatestVersion } from './helpers/main.js'

// This uses a global environment variable to manipulate the cache file.
// Since this is global we:
//  - must use `test.serial()`
//  - must be done in a separate test file so it's in a different process than
//    the other tests
each(
  [
    { result: true },
    { result: true, fetch: false },
    { result: false, fetch: true },
    { result: false, oldCacheFile: true },
    { result: true, fetch: false, oldCacheFile: true },
  ],
  ({ title }, { result, fetch, oldCacheFile }) => {
    test.serial(`Caching | ${title}`, async (t) => {
      setTestCache()

      try {
        await writeCacheFile(oldCacheFile)

        const latestVersion = await getLatestVersion({ fetch })
        t.is(latestVersion === '1.0.0', result)
      } finally {
        await removeCacheFile()
        unsetTestCache()
      }
    })
  },
)

test.serial('No cache file', async (t) => {
  setTestCache()

  try {
    const latestVersion = await getLatestVersion({ fetch: false })
    t.not(latestVersion, '1.0.0')
  } finally {
    await removeCacheFile()
    unsetTestCache()
  }
})

each(
  [
    { result: true },
    { result: true, fetch: false },
    { result: false, fetch: true },
  ],
  ({ title }, { result, fetch }) => {
    test.serial(`Twice in same process | ${title}`, async (t) => {
      setTestCache()

      try {
        await writeCacheFile()

        await getLatestVersion({ fetch: false })
      } finally {
        await removeCacheFile()
        unsetTestCache()
      }

      const latestVersion = await getLatestVersion({ fetch })
      t.is(latestVersion === '1.0.0', result)
    })
  },
)
