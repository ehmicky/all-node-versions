// Group array into an object using a function, property or array of properties
// Uses imperative code for performance
export const groupBy = function (array, group) {
  const object = {}

  // eslint-disable-next-line fp/no-loops
  for (const item of array) {
    const key = String(item[group])

    // eslint-disable-next-line max-depth
    if (object[key] === undefined) {
      // eslint-disable-next-line fp/no-mutation
      object[key] = [item]
    } else {
      // eslint-disable-next-line fp/no-mutating-methods
      object[key].push(item)
    }
  }

  return object
}
