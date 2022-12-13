import allNodeVersions from 'all-node-versions'
import test from 'ava'
import isPlainObj from 'is-plain-obj'
import semver from 'semver'

const isValidVersionInfo = ({ node, npm }) =>
  isSemverVersion(node) && (npm === undefined || isSemverVersion(npm))

const isSemverVersion = (nodeVersion) =>
  typeof nodeVersion === 'string' && VERSION_REGEXP.test(nodeVersion)

const VERSION_REGEXP = /^\d+\.\d+\.\d+/u

test('"versions" are present', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })

  t.true(Array.isArray(versions))
  t.true(versions.every(isValidVersionInfo))
})

test('"versions" are sorted', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedVersions = [...versions].sort((versionInfoA, versionInfoB) =>
    semver.rcompare(versionInfoA.node, versionInfoB.node),
  )

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

const isValidMajor = ({ major }) => Number.isInteger(major)

test('"majors.major" are sorted', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedMajors = [...majors].sort(compareMajor)

  t.deepEqual(majors, sortedMajors)
})

const compareMajor = ({ major: majorA }, { major: majorB }) =>
  majorA < majorB ? 1 : -1

test('"majors.latest" are present', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })

  t.true(majors.every(isValidLatest))
})

const isValidLatest = ({ latest }) => isSemverVersion(latest)

test('"majors.lts" are present', async (t) => {
  const { majors } = await allNodeVersions({ fetch: true })

  t.true(majors.every(isValidLts))
  t.false(majors.every(isLts))
})

const isValidLts = ({ lts }) =>
  lts === undefined ||
  (typeof lts === 'string' && lts !== '' && lts.toLowerCase() === lts)

const isLts = ({ lts }) => lts !== undefined
