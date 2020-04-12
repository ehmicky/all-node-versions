import test from 'ava'
import { rcompare } from 'semver'

import allNodeVersions from '../src/main.js'

test('Success', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })

  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

const isVersion = function (version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u

test('Versions are sorted', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedVersions = versions.slice().sort(rcompare)

  t.true(versions.every((version, index) => version === sortedVersions[index]))
})
