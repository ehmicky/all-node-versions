import test from 'ava'
import isPlainObj from 'is-plain-obj'
import { rcompare } from 'semver'

import allNodeVersions from '../src/main.js'

const isVersion = function (version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u

test('"versions" are present', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })

  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

test('"versions" are sorted', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedVersions = versions.slice().sort(rcompare)

  t.deepEqual(versions, sortedVersions)
})

test('"majors" are present', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })

  t.true(Array.isArray(majors))
  t.true(majors.every(isPlainObj))
})

test('"majors.major" are present', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })

  t.true(majors.every(isValidMajor))
})

const isValidMajor = function ({ major }) {
  return Number.isInteger(major)
}

test('"majors.major" are sorted', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedMajors = majors.slice().sort(compareMajor)

  t.deepEqual(majors, sortedMajors)
})

const compareMajor = function ({ major: majorA }, { major: majorB }) {
  return majorA < majorB ? 1 : -1
}

test('"majors.latest" are present', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })

  t.true(majors.every(isValidLatest))
})

const isValidLatest = function ({ latest }) {
  return isVersion(latest)
}

test('"majors.lts" are present', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })

  t.true(majors.every(isValidLts))
  t.false(majors.every(isLts))
})

const isValidLts = function ({ lts }) {
  return (
    lts === undefined ||
    (typeof lts === 'string' && lts !== '' && lts.toLowerCase() === lts)
  )
}

const isLts = function ({ lts }) {
  return lts !== undefined
}
