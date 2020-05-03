// Validate an option against a list of enums
export const validateEnums = function (opts, enums) {
  Object.entries(enums).forEach(([optName, enumValues]) => {
    validateEnum(optName, opts[optName], enumValues)
  })
}

const validateEnum = function (optName, value, enumValues) {
  if (value !== undefined && !enumValues.includes(value)) {
    const values = enumValues.join(', ')
    throw new Error(
      `The '${optName}' option must not be "${value}" but one of: ${values}`,
    )
  }
}
