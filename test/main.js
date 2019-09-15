import test from 'ava'
import { rcompare } from 'semver'
import { getBinPath } from 'get-bin-path'
import execa from 'execa'
import { each } from 'test-each'

import allNodeVersions from '../src/main.js'

const allNodeVersionsCli = async function(args = '') {
  const binPath = await getBinPath()
  const { stdout } = await execa.command(`${binPath} ${args}`)
  const versions = stdout.split('\n')
  return versions
}

const isVersion = function(version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u

each([allNodeVersions, allNodeVersionsCli], ({ title }, getVersions) => {
  test(`Success | ${title}`, async t => {
    const versions = await getVersions()

    t.true(Array.isArray(versions))
    t.true(versions.every(isVersion))
  })

  test(`Versions are sorted | ${title}`, async t => {
    const versions = await getVersions()
    // eslint-disable-next-line fp/no-mutating-methods
    const sortedVersions = versions.slice().sort(rcompare)

    t.true(
      // eslint-disable-next-line max-nested-callbacks
      versions.every((version, index) => version === sortedVersions[index]),
    )
  })
})

test(`Invalid argument | CLI`, async t => {
  await t.throwsAsync(allNodeVersionsCli('--invalid'))
})

test(`--mirror | CLI`, async t => {
  const versions = await allNodeVersionsCli(`--mirror=${MIRROR_URL}`)

  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

const MIRROR_URL = 'https://npm.taobao.org/mirrors/node'
