import allNodeVersions from 'all-node-versions'
import test from 'ava'
import { each } from 'test-each'

import {
  removeCacheFile,
  setTestCache,
  unsetTestCache,
  writeCacheFile,
} from '../helpers/cache.test.js'
import { getLatestVersion } from '../helpers/main.test.js'

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
  ({ title }, { result, fetch: fetchOpt, oldCacheFile }) => {
    test.serial(`Caching | ${title}`, async (t) => {
      setTestCache()

      try {
        await writeCacheFile(oldCacheFile)

        const latestVersion = await getLatestVersion({ fetch: fetchOpt })
        t.is(latestVersion === 'cached', result)
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
    t.not(latestVersion, 'cached')
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
  ({ title }, { result, fetch: fetchOpt }) => {
    test.serial(`Twice in same process | ${title}`, async (t) => {
      setTestCache()

      try {
        await writeCacheFile()

        await getLatestVersion({ fetch: false })
      } finally {
        await removeCacheFile()
        unsetTestCache()
      }

      const latestVersion = await getLatestVersion({ fetch: fetchOpt })
      t.is(latestVersion === 'cached', result)
    })
  },
)

test.serial(`Process cached files cannot be mutated`, async (t) => {
  const { versions } = await allNodeVersions({ fetch: false })
  const [{ node: firstVersion }] = versions
  // eslint-disable-next-line fp/no-mutation
  versions[0].node = 'test'
  versions.reverse()
  const {
    versions: [{ node: firstVersionAgain }],
  } = await allNodeVersions({ fetch: false })
  t.is(firstVersionAgain, firstVersion)
})
