import test from 'ava'
import { each } from 'test-each'

import allNodeVersions from '../src/main.js'

import {
  setTestCache,
  unsetTestCache,
  writeCacheFile,
  removeCacheFile,
} from './helpers/cache.js'

// Offline cache is used both when offline or when `mirror` is invalid.
// We only test the later case since it's simpler to test.
const INVALID_MIRROR = 'http://invalid-mirror.com'

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

        const [version] = await allNodeVersions({ fetch })
        t.is(version === 'cached', result)
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
    const [version] = await allNodeVersions({ fetch: false })
    t.not(version, 'cached')
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

        await allNodeVersions({ fetch: false })
      } finally {
        await removeCacheFile()
        unsetTestCache()
      }

      const versionsAgain = await allNodeVersions({ fetch })
      t.is(versionsAgain[0] === 'cached', result)
    })
  },
)

test.serial(`Offline | fetch: true`, async (t) => {
  setTestCache()

  try {
    await writeCacheFile()

    await allNodeVersions({ fetch: false })
    const [versionAgain] = await allNodeVersions({
      fetch: true,
      mirror: INVALID_MIRROR,
    })
    t.is(versionAgain, 'cached')
  } finally {
    await removeCacheFile()
    unsetTestCache()
  }
})

test.serial(`Offline | no cache`, async (t) => {
  setTestCache()

  try {
    await t.throwsAsync(
      allNodeVersions({ fetch: false, mirror: INVALID_MIRROR }),
    )
  } finally {
    unsetTestCache()
  }
})
