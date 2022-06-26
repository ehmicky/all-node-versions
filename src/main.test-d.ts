import allNodeVersions, {
  Options,
  AllNodeVersions,
  MajorNodeVersion,
  SemverVersion,
} from 'all-node-versions'
import {
  expectType,
  expectError,
  expectAssignable,
  expectNotAssignable,
} from 'tsd'
import { NodeVersionInfo } from './main'

const nodeVersions = await allNodeVersions()

allNodeVersions({})
expectAssignable<Options>({})
expectError(allNodeVersions(true))

allNodeVersions({ mirror: 'http://example.com' })
expectAssignable<Options>({ mirror: 'http://example.com' })
expectError(allNodeVersions({ mirror: true }))

allNodeVersions({ fetch: true })
allNodeVersions({ fetch: undefined })
expectAssignable<Options>({ fetch: true })
expectError(allNodeVersions({ fetch: 'true' }))

expectType<AllNodeVersions>(nodeVersions)
const {
  versions: [version],
  majors: [majorNodeVersion],
} = nodeVersions

expectType<NodeVersionInfo>(version)
const { node, npm } = version
expectAssignable<SemverVersion>(node)
expectType<SemverVersion | undefined>(npm)

expectType<MajorNodeVersion>(majorNodeVersion)
const { major, latest, lts } = majorNodeVersion
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
