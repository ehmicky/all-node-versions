import semver from 'semver'

import { groupBy } from './group.js'

// Normalize index of versions to a simpler list of versions
export const normalizeIndex = function (index) {
  const indexItems = index.map(normalizeVersion)
  const versions = getAllVersions(indexItems)
  const majors = getMajors(indexItems)
  return { versions, majors }
}

const normalizeVersion = function ({ version, lts, npm }) {
  // Remove the leading `v`
  const versionA = version.slice(1)
  const major = semver.major(versionA)
  return { version: versionA, major, lts, npm }
}

// Array with all `{ node: string, npm: string }` version infos
const getAllVersions = function (indexItems) {
  return indexItems.map(getVersionField)
}

const getVersionField = function ({ version, npm }) {
  return { node: version, npm }
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

// `index.json` is already sorted, but we ensure it is, just in case
const compareMajor = function ({ major: majorA }, { major: majorB }) {
  /* c8 ignore next */
  return majorA < majorB ? 1 : -1
}
