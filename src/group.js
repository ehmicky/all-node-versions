// Group array into an object using a function, property or array of properties
export const groupBy = function (array, group) {
  const mapper = getMapper(group)
  return groupByFunc(array, mapper)
}

const getMapper = function (group) {
  if (typeof group === 'function') {
    return group
  }

  if (typeof group === 'string') {
    return getByProp.bind(null, group)
  }

  if (Array.isArray(group)) {
    return getByProps.bind(null, group)
  }

  throw new Error(`Group must be a function, property or array of properties`)
}

// Uses imperative code for performance
const getByProps = function (propNames, object) {
  // eslint-disable-next-line fp/no-let
  let keys = ''

  // eslint-disable-next-line fp/no-loops
  for (const propName of propNames) {
    const key = getByProp(propName, object)

    // eslint-disable-next-line max-depth
    if (keys === '') {
      // eslint-disable-next-line fp/no-mutation
      keys = key
    } else {
      // eslint-disable-next-line fp/no-mutation
      keys = `${keys}.${key}`
    }
  }

  return keys
}

// `object` can be an array and `propName` an index integer
const getByProp = function (propName, object) {
  if (object === null || typeof object !== 'object') {
    return ''
  }

  return String(object[propName])
}

// Uses imperative code for performance
const groupByFunc = function (array, mapper) {
  const object = {}

  // eslint-disable-next-line fp/no-loops
  for (const item of array) {
    const key = String(mapper(item))

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
