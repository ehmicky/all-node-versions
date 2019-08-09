import test from 'ava'

import allNodeVersions from '../src/main.js'

test('Success', async t => {
  const versions = await allNodeVersions()
  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

const isVersion = function(version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u
