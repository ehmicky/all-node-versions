[![Node](https://img.shields.io/badge/-Node.js-808080?logo=node.js&colorA=404040&logoColor=66cc33)](https://www.npmjs.com/package/all-node-versions)
[![TypeScript](https://img.shields.io/badge/-Typed-808080?logo=typescript&colorA=404040&logoColor=0096ff)](/types/main.d.ts)
[![Codecov](https://img.shields.io/badge/-Tested%20100%25-808080?logo=codecov&colorA=404040)](https://codecov.io/gh/ehmicky/all-node-versions)
[![Twitter](https://img.shields.io/badge/-Twitter-808080.svg?logo=twitter&colorA=404040)](https://twitter.com/intent/follow?screen_name=ehmicky)
[![Medium](https://img.shields.io/badge/-Medium-808080.svg?logo=medium&colorA=404040)](https://medium.com/@ehmicky)

List all available Node.js versions.

Sorted from the most to the least recent. Includes major release and LTS
information.

# Install

```bash
npm install all-node-versions
```

This package works in Node.js >=14.18.0. It is an ES module and must be loaded
using
[an `import` or `import()` statement](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c),
not `require()`.

# Usage

```js
import allNodeVersions from 'all-node-versions'

const {
  versions,
  // [
  //   { node: '18.4.0', npm: '8.12.1' },
  //   { node: '18.3.0', npm: '8.11.0' },
  //   ...
  //   { node: '0.1.14' },
  // ]
  majors,
  // [
  //   { major: 18, latest: '18.4.0' },
  //   { major: 17, latest: '17.9.1' },
  //   { major: 16, latest: '16.15.1', lts: 'gallium' },
  //   { major: 15, latest: '15.14.0' },
  //   { major: 14, latest: '14.19.3', lts: 'fermium },
  //   { major: 13, latest: '13.14.0' },
  //   { major: 12, latest: '12.22.12', lts: 'erbium' },
  //   { major: 11, latest: '11.15.0' },
  //   { major: 10, latest: '10.24.1', lts: 'dubnium' },
  //   { major: 9, latest: '9.11.2' },
  //   { major: 8, latest: '8.17.0', lts: 'carbon' },
  //   { major: 7, latest: '7.10.1' },
  //   { major: 6, latest: '6.17.1', lts: 'boron' },
  //   { major: 5, latest: '5.12.0' },
  //   { major: 4, latest: '4.9.1', lts: 'argon' },
  //   { major: 0, latest: '0.12.18' }
  // ]
} = await allNodeVersions(options)
```

## allNodeVersions(options?)

`options`: `object`\
_Returns_: `Promise<object>`

### Return value

The return value resolves to an object with the following properties.

#### versions

_Type_: `object[]`

List of available Node.js versions and related information. Sorted from the most
to the least recent Node.js version.

##### node

_Type_: `string`

Node.js version as a `major.minor.patch` string.

##### npm

_Type_: `string?`

Default NPM version as a `major.minor.patch[-tags]` string. `undefined` if the
[`node` version](#node) is `0.6.2` or older.

#### majors

_Type_: `object[]`

List of Node.js major releases sorted from the most to the least recent. Each
major release has the following properties.

##### major

_Type_: `number`

Major version number. `0` for old releases `0.*.*`.

##### latest

_Type_: `string`

Latest version for that major release, as a `major.minor.patch` string.

##### lts

_Type_: `string?`

LTS name, lowercased. `undefined` if the major release is not LTS.

### options

#### mirror

_Type_: `string`\
_Default_: `https://nodejs.org/dist`

Base URL to fetch the list of available Node.js versions. Can be customized (for
example `https://npmmirror.com/mirrors/node`).

The following environment variables can also be used: `NODE_MIRROR`,
`NVM_NODEJS_ORG_MIRROR`, `N_NODE_MIRROR` or `NODIST_NODE_MIRROR`.

#### fetch

_Type_: `boolean`\
_Default_: `undefined`

The list of available Node.js versions is cached for one hour by default. If the
`fetch` option is:

- `true`: the cache will not be used
- `false`: the cache will be used even if it's older than one hour

# See also

- [`nve`](https://github.com/ehmicky/nve): Run a specific Node.js version (CLI)
- [`nvexeca`](https://github.com/ehmicky/nve): Run a specific Node.js version
  (programmatic)
- [`get-node`](https://github.com/ehmicky/get-node): Download Node.js
- [`preferred-node-version`](https://github.com/ehmicky/preferred-node-version):
  Get the preferred Node.js version of a project or user
- [`node-version-alias`](https://github.com/ehmicky/node-version-alias): Resolve
  Node.js version aliases like `latest`, `lts` or `erbium`
- [`normalize-node-version`](https://github.com/ehmicky/normalize-node-version):
  Normalize and validate Node.js versions
- [`fetch-node-website`](https://github.com/ehmicky/fetch-node-website): Fetch
  releases on nodejs.org

# Support

For any question, _don't hesitate_ to [submit an issue on GitHub](../../issues).

Everyone is welcome regardless of personal background. We enforce a
[Code of conduct](CODE_OF_CONDUCT.md) in order to promote a positive and
inclusive environment.

# Contributing

This project was made with ❤️. The simplest way to give back is by starring and
sharing it online.

If the documentation is unclear or has a typo, please click on the page's `Edit`
button (pencil icon) and suggest a correction.

If you would like to help us fix a bug or add a new feature, please check our
[guidelines](CONTRIBUTING.md). Pull requests are welcome!

<!-- Thanks go to our wonderful contributors: -->

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://twitter.com/ehmicky"><img src="https://avatars2.githubusercontent.com/u/8136211?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ehmicky</b></sub></a><br /><a href="https://github.com/ehmicky/all-node-versions/commits?author=ehmicky" title="Code">💻</a> <a href="#design-ehmicky" title="Design">🎨</a> <a href="#ideas-ehmicky" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ehmicky/all-node-versions/commits?author=ehmicky" title="Documentation">📖</a></td>
    <td align="center"><a href="https://maxim.mazurok.com"><img src="https://avatars.githubusercontent.com/u/7756211?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Maxim Mazurok</b></sub></a><br /><a href="#ideas-Maxim-Mazurok" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ehmicky/all-node-versions/commits?author=Maxim-Mazurok" title="Code">💻</a> <a href="https://github.com/ehmicky/all-node-versions/commits?author=Maxim-Mazurok" title="Tests">⚠️</a> <a href="https://github.com/ehmicky/all-node-versions/commits?author=Maxim-Mazurok" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
