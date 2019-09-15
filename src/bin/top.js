import yargs from 'yargs'

export const defineCli = function() {
  return yargs
    .options(CONFIG)
    .usage(USAGE)
    .help()
    .version()
    .strict()
}

const CONFIG = {}

const USAGE = `$0 [OPTIONS...]

List all available Node.js versions.
Sorted from the latest Node.js version to the oldest one.`
