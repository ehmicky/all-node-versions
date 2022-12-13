import semver from 'semver'

import { groupBy } from './group.js'

// Normalize index of versions to a simpler list of versions
export const normalizeIndex = (index) => {
  const indexItems = index.map(normalizeVersion)
  const versions = getAllVersions(indexItems)
  const majors = getMajors(indexItems)
  return { versions, majors }
}

const normalizeVersion = ({ version, lts, npm }) => {
  // Remove the leading `v`
  const versionA = version.slice(1)
  const major = semver.major(versionA)
  return { version: versionA, major, lts, npm }
}

// Array with all `{ node: string, npm: string }` version infos
const getAllVersions = (indexItems) => indexItems.map(getVersionField)

const getVersionField = ({ version, npm }) => ({ node: version, npm })

// Array with all major releases latest version, sorted from most to least
// recent. Includes `lts` name if any.
const getMajors = (indexItems) => {
  const groups = groupBy(indexItems, 'major')
  // eslint-disable-next-line fp/no-mutating-methods
  return Object.values(groups).map(getMajorInfo).sort(compareMajor)
}

const getMajorInfo = (versions) => {
  const [{ major, version: latest }] = versions
  const lts = getLts(versions)
  return { major, latest, ...lts }
}

const getLts = (versions) => {
  const ltsVersion = versions.find(getLtsField)

  if (ltsVersion === undefined) {
    return {}
  }

  const lts = ltsVersion.lts.toLowerCase()
  return { lts }
}

const getLtsField = ({ lts }) => typeof lts === 'string'

// `index.json` is already sorted, but we ensure it is, just in case
const compareMajor = ({ major: majorA }, { major: majorB }) =>
  majorA < majorB ? 1 : -1
