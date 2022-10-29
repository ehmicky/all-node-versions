import type { Options as FetchNodeWebsiteOptions } from 'fetch-node-website'

/**
 * Semantic version
 */
export type SemverVersion = `${number}.${number}.${number}${string}`

export interface NodeVersionInfo {
  /**
   * Node.js version as a `major.minor.patch` string.
   */
  node: SemverVersion

  /**
   * Default NPM version as a `major.minor.patch[-tags]` string.
   * `undefined` if the `node` version is `0.6.2` or older.
   */
  npm?: SemverVersion
}

export interface MajorNodeVersion {
  /**
   * Major version number. `0` for old releases `0.*.*`.
   */
  major: number

  /**
   * Latest version for that major release, as a `major.minor.patch` string.
   */
  latest: SemverVersion

  /**
   * LTS name, lowercased. `undefined` if the major release is not LTS.
   */
  lts?: string
}

export interface AllNodeVersions {
  /**
   * List of available Node.js versions and related information.
   * Sorted from the most to the least recent Node.js version.
   */
  versions: NodeVersionInfo[]

  /**
   * List of Node.js major releases sorted from the most to the least recent.
   */
  majors: MajorNodeVersion[]
}

export interface Options {
  /**
   * Base URL to fetch the list of available Node.js versions.
   * Can be customized (for example `https://npmmirror.com/mirrors/node`).
   *
   * The following environment variables can also be used: `NODE_MIRROR`,
   * `NVM_NODEJS_ORG_MIRROR`, `N_NODE_MIRROR` or `NODIST_NODE_MIRROR`.
   *
   * @default 'https://nodejs.org/dist'
   */
  mirror?: FetchNodeWebsiteOptions['mirror']

  /**
   * The list of available Node.js versions is cached for one hour by default.
   * If the `fetch` option is:
   *  - `true`: the cache will not be used
   *  - `false`: the cache will be used even if it's older than one hour
   *
   * @default `undefined`
   */
  fetch?: boolean | undefined
}

/**
 * List all available Node.js versions.
 * Sorted from the most to the least recent.
 * Includes major release and LTS information.
 *
 * @example
 * ```js
 * const {
 *   versions,
 *   // ['18.4.0', '18.3.0', ..., '0.1.15', '0.1.14']
 *   majors,
 *   // [
 *   //   { major: 18, latest: '18.4.0' },
 *   //   { major: 17, latest: '17.9.1' },
 *   //   { major: 16, latest: '16.15.1', lts: 'gallium' },
 *   //   { major: 15, latest: '15.14.0' },
 *   //   { major: 14, latest: '14.19.3', lts: 'fermium },
 *   //   { major: 13, latest: '13.14.0' },
 *   //   { major: 12, latest: '12.22.12', lts: 'erbium' },
 *   //   { major: 11, latest: '11.15.0' },
 *   //   { major: 10, latest: '10.24.1', lts: 'dubnium' },
 *   //   { major: 9, latest: '9.11.2' },
 *   //   { major: 8, latest: '8.17.0', lts: 'carbon' },
 *   //   { major: 7, latest: '7.10.1' },
 *   //   { major: 6, latest: '6.17.1', lts: 'boron' },
 *   //   { major: 5, latest: '5.12.0' },
 *   //   { major: 4, latest: '4.9.1', lts: 'argon' },
 *   //   { major: 0, latest: '0.12.18' }
 *   // ]
 * } = await allNodeVersions(options)
 * ```
 */
export default function allNodeVersions(
  options?: Options,
): Promise<AllNodeVersions>
