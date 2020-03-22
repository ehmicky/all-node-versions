import test from 'ava'
import { rcompare } from 'semver'

import allNodeVersions from '../src/main.js'

const isVersion = function (version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u

test('Success', async (t) => {
  const versions = await allNodeVersions()

  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

test('Versions are sorted', async (t) => {
  const versions = await allNodeVersions()
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedVersions = versions.slice().sort(rcompare)

  t.true(versions.every((version, index) => version === sortedVersions[index]))
})
