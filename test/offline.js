import test from 'ava'

import {
  setTestCache,
  unsetTestCache,
  writeCacheFile,
  removeCacheFile,
} from './helpers/cache.js'
import { getLatestVersion } from './helpers/main.js'

// Offline cache is used both when offline or when `mirror` is invalid.
// We only test the later case since it's simpler to test.
const INVALID_MIRROR = 'http://invalid-mirror.com'

// See `test/cache.js` on why `test.serial()` is needed
test.serial(`Offline | fetch: true`, async (t) => {
  setTestCache()

  try {
    await writeCacheFile()

    await getLatestVersion({ fetch: false })
    const latestVersion = await getLatestVersion({
      fetch: true,
      mirror: INVALID_MIRROR,
    })
    t.is(latestVersion, 'cached')
  } finally {
    await removeCacheFile()
    unsetTestCache()
  }
})

test.serial(`Offline | no cache`, async (t) => {
  setTestCache()

  try {
    await t.throwsAsync(
      getLatestVersion({ fetch: false, mirror: INVALID_MIRROR }),
    )
  } finally {
    unsetTestCache()
  }
})
