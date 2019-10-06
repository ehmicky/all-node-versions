import test from 'ava'
import { rcompare } from 'semver'
import { getBinPath } from 'get-bin-path'
import execa from 'execa'
import { each } from 'test-each'

import allNodeVersions from '../src/main.js'

const getVersionsCli = async function(args) {
  const { stdout } = await allNodeVersionsCli(args)
  const versions = stdout.split('\n')
  return versions
}

const allNodeVersionsCli = async function(args = '') {
  const binPath = await getBinPath()
  const { stdout, stderr } = await execa.command(`${binPath} ${args}`)
  return { stdout, stderr }
}

const isVersion = function(version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u

each([allNodeVersions, getVersionsCli], ({ title }, getVersions) => {
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
  const versions = await getVersionsCli(`--mirror=${MIRROR_URL}`)

  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

const MIRROR_URL = 'https://npm.taobao.org/mirrors/node'

each(
  [
    { args: '--no-progress', called: false },
    { args: '--progress', called: true },
    { called: true },
  ],
  ({ title }, { args, called }) => {
    test.serial(`--progress | CLI ${title}`, async t => {
      const { stderr } = await allNodeVersionsCli(args)

      t.is(stderr.trim() !== '', called)
    })
  },
)
