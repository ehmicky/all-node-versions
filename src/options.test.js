import allNodeVersions from 'all-node-versions'
import test from 'ava'
import { each } from 'test-each'

each(
  [
    true,
    { fetch: true, mirror: 'not_valid_url' },
    { fetch: true, signal: 'signal' },
    { fetch: 0 },
  ],
  ({ title }, opts) => {
    test(`Invalid options | ${title}`, async (t) => {
      await t.throwsAsync(allNodeVersions(opts))
    })
  },
)
