import semver from 'semver'

import { groupBy } from './group.js'

// Normalize index of versions to a simpler list of versions
export const normalizeIndex = function (index) {
  const indexItems = index.map(normalizeVersion)
  const versions = getAllVersions(indexItems)
  const majors = getMajors(indexItems)
  return { versions, majors }
}

const normalizeVersion = function ({ version, lts }) {
  // Remove the leading `v`
  const versionA = version.slice(1)
  const major = semver.major(versionA)
  return { version: versionA, major, lts }
}

// Array with all version strings, sorted from most to least recent
const getAllVersions = function (indexItems) {
  return indexItems.map(getVersionField)
}

const getVersionField = function ({ version }) {
  return version
}

// Array with all major releases latest version, sorted from most to least
// recent. Includes `lts` name if any.
const getMajors = function (indexItems) {
  const groups = groupBy(indexItems, 'major')
  // eslint-disable-next-line fp/no-mutating-methods
  return Object.values(groups).map(getMajorInfo).sort(compareMajor)
}

const getMajorInfo = function (versions) {
  const [{ major, version: latest }] = versions
  const lts = getLts(versions)
  return { major, latest, ...lts }
}

const getLts = function (versions) {
  const ltsVersion = versions.find(getLtsField)

  if (ltsVersion === undefined) {
    return {}
  }

  const lts = ltsVersion.lts.toLowerCase()
  return { lts }
}

const getLtsField = function ({ lts }) {
  return typeof lts === 'string'
}

const compareMajor = function ({ major: majorA }, { major: majorB }) {
  return majorA < majorB ? 1 : -1
}
