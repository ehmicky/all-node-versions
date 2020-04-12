import { promises as fs } from 'fs'

import test from 'ava'
import { each } from 'test-each'

import allNodeVersions from '../src/main.js'

import {
  setTestCache,
  writeCacheFile,
  unsetTestCache,
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
    { result: false },
    { result: false, fetch: false },
    { result: true, fetch: true },
    { result: true, fetch: false, oldCacheFile: true },
  ],
  ({ title }, { result, fetch, oldCacheFile }) => {
    test.serial(`Caching | ${title}`, async (t) => {
      setTestCache()

      try {
        const cacheFile = await writeCacheFile(oldCacheFile)

        const [version] = await allNodeVersions({ fetch })
        t.is(version === 'cached', result)

        await fs.unlink(cacheFile)
      } finally {
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
    unsetTestCache()
  }
})

test.serial('Twice in same process', async (t) => {
  setTestCache()

  try {
    const cacheFile = await writeCacheFile()

    const [version] = await allNodeVersions({ fetch: false })
    t.is(version, 'cached')

    await fs.unlink(cacheFile)
  } finally {
    unsetTestCache()
  }

  const versionsAgain = await allNodeVersions()
  t.is(versionsAgain[0], 'cached')
})

each([true, undefined, false], ({ title }, fetch) => {
  test.serial(`Offline | fetch: ${title}`, async (t) => {
    setTestCache()

    try {
      const cacheFile = await writeCacheFile()

      const [version] = await allNodeVersions({ fetch: false })
      t.is(version, 'cached')

      await fs.unlink(cacheFile)
    } finally {
      unsetTestCache()
    }

    const [versionAgain] = await allNodeVersions({
      fetch,
      mirror: INVALID_MIRROR,
    })
    t.is(versionAgain, 'cached')
  })
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
