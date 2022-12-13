// Clone cached versions to prevent mutations
// TODO: use `structuredClone()` after dropping support for Node <17.0.0
export const cloneCachedVersions = ({ versions, majors }) => ({
  versions: shallowCloneObjectsArray(versions),
  majors: shallowCloneObjectsArray(majors),
})

const shallowCloneObjectsArray = (arrayOfObjects) =>
  arrayOfObjects.map(shallowCloneObject)

const shallowCloneObject = (object) => ({ ...object })
