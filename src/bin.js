#!/usr/bin/env node
import { exit } from 'process'

import allNodeVersions from './main.js'

// Prints all available Node versions on the console
const runCli = async function() {
  try {
    const versions = await allNodeVersions()
    console.log(versions.join('\n'))
  } catch (error) {
    console.error(error.message)
    exit(1)
  }
}

runCli()
