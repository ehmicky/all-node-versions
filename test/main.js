import allNodeVersions from 'all-node-versions'
import test from 'ava'
import isPlainObj from 'is-plain-obj'
import semver from 'semver'

const isVersion = function (version) {
  return typeof version === 'string' && VERSION_REGEXP.test(version)
}

const isNodeNpmVersion = function (nodeNpmVersion) {
  return (
    typeof nodeNpmVersion.node === 'string' &&
    VERSION_REGEXP.test(nodeNpmVersion.node) &&
    typeof nodeNpmVersion.npm === 'string' &&
    NPM_VERSION_REGEXP.test(nodeNpmVersion.npm)
  )
}

const VERSION_REGEXP = /^\d+\.\d+\.\d+$/u

/**
 * Real examples:
 * 1.1.0-beta-4
 * 1.1.0-alpha-6
 * 1.1.18
 * 6.5.0-next.0
 * 1.1.0-3
 */
const NPM_VERSION_REGEXP =
  /^\d+\.\d+\.\d+((-(alpha|beta)-\d+)|(-next\.\d+)|(-\d+))?$/u

test('"versions" are present', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })

  t.true(Array.isArray(versions))
  t.true(versions.every(isVersion))
})

test('"versions" are sorted', async (t) => {
  const { versions } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods
  const sortedVersions = [...versions].sort(semver.rcompare)

  t.deepEqual(versions, sortedVersions)
})

test('"nodeNpmVersions" are present', async (t) => {
  const { nodeNpmVersions } = await allNodeVersions({ fetch: true })

  t.true(Array.isArray(nodeNpmVersions))
  t.true(nodeNpmVersions.every(isNodeNpmVersion))
})

test('"nodeNpmVersions" are sorted', async (t) => {
  const { nodeNpmVersions } = await allNodeVersions({ fetch: true })
  // eslint-disable-next-line fp/no-mutating-methods, id-length
  const sortedVersions = [...nodeNpmVersions].sort((a, b) =>
    semver.rcompare(a.node, b.node),
  )

  t.deepEqual(nodeNpmVersions, sortedVersions)
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
  const sortedMajors = [...majors].sort(compareMajor)

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
