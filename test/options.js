import test from 'ava'
import { each } from 'test-each'

import allNodeVersions from '../src/main.js'

each(
  [{ mirror: 'not_valid_url', fetch: true }, { fetch: 0 }],
  ({ title }, opts) => {
    test(`Invalid options | ${title}`, async (t) => {
      await t.throwsAsync(allNodeVersions(opts))
    })
  },
)
