// Clone cached versions to prevent mutations
// TODO: use `structuredClone()` after dropping support for Node <17.0.0
export const cloneCachedVersions = function ({ versions, majors }) {
  return { versions: [...versions], majors: majors.map(shallowCloneObject) }
}

const shallowCloneObject = function (object) {
  return { ...object }
}
