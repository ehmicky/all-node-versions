import allNodeVersions, {
  type Options,
  type AllNodeVersions,
  type MajorNodeVersion,
  type NodeVersionInfo,
  type SemverVersion,
} from 'all-node-versions'
import { expectType, expectAssignable, expectNotAssignable } from 'tsd'

const nodeVersions = await allNodeVersions()

await allNodeVersions({})
expectAssignable<Options>({})
// @ts-expect-error
await allNodeVersions(true)

await allNodeVersions({ mirror: 'http://example.com' })
expectAssignable<Options>({ mirror: 'http://example.com' })
// @ts-expect-error
await allNodeVersions({ mirror: true })

await allNodeVersions({ fetch: true })
await allNodeVersions({ fetch: undefined })
expectAssignable<Options>({ fetch: true })
// @ts-expect-error
await allNodeVersions({ fetch: 'true' })

expectType<AllNodeVersions>(nodeVersions)
const {
  versions: [nodeVersion],
  majors: [majorNodeVersion],
} = nodeVersions

expectType<NodeVersionInfo>(nodeVersion!)
const { node, npm } = nodeVersion!
expectAssignable<SemverVersion>(node)
expectAssignable<SemverVersion | undefined>(npm)

expectType<MajorNodeVersion>(majorNodeVersion!)
const { major, latest, lts } = majorNodeVersion!
expectType<number>(major)
expectAssignable<SemverVersion>(latest)
expectType<string | undefined>(lts)

expectAssignable<SemverVersion>('1.2.3')
expectAssignable<SemverVersion>('0.0.1')
expectAssignable<SemverVersion>('10.10.10')
expectAssignable<SemverVersion>('1.2.3-beta')
expectNotAssignable<SemverVersion>('1.2.a')
expectNotAssignable<SemverVersion>('1.2')
expectNotAssignable<SemverVersion>('1')
