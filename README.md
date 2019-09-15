[![Codecov](https://img.shields.io/codecov/c/github/ehmicky/all-node-versions.svg?label=tested&logo=codecov)](https://codecov.io/gh/ehmicky/all-node-versions)
[![Travis](https://img.shields.io/badge/cross-platform-4cc61e.svg?logo=travis)](https://travis-ci.org/ehmicky/all-node-versions)
[![Node](https://img.shields.io/node/v/all-node-versions.svg?logo=node.js)](https://www.npmjs.com/package/all-node-versions)
[![Gitter](https://img.shields.io/gitter/room/ehmicky/all-node-versions.svg?logo=gitter)](https://gitter.im/ehmicky/all-node-versions)
[![Twitter](https://img.shields.io/badge/%E2%80%8B-twitter-4cc61e.svg?logo=twitter)](https://twitter.com/intent/follow?screen_name=ehmicky)
[![Medium](https://img.shields.io/badge/%E2%80%8B-medium-4cc61e.svg?logo=medium)](https://medium.com/@ehmicky)

List all available Node.js versions.

Sorted from the latest Node.js version to the oldest one.

# Install

```bash
npm install all-node-versions
```

# Usage (Node.js)

<!-- Remove 'eslint-skip' once estree supports top-level await -->
<!-- eslint-skip -->

```js
const allNodeVersions = require('all-node-versions')

const versions = await allNodeVersions()
// ['12.8.0', '12.7.0', ..., '0.1.15', '0.1.14']
```

## allNodeVersions(options?)

`options`: `object`<br>_Returns_: `Promise<string[]>`

### options

#### mirror

_Type_: `string`<br>_Default_: `https://nodejs.org/dist`

Base URL. Can be customized (for example `https://npm.taobao.org/mirrors/node`).

The following environment variables can also be used: `NODE_MIRROR`,
`NVM_NODEJS_ORG_MIRROR`, `N_NODE_MIRROR` or `NODIST_NODE_MIRROR`.

# Usage (CLI)

```
$ all-node-versions
12.10.0
12.9.1
...
0.1.15
0.1.14
```

# See also

- [`nve`](https://github.com/ehmicky/nve): Run a specific Node.js version
- [`get-node`](https://github.com/ehmicky/get-node): Download Node.js
- [`normalize-node-version`](https://github.com/ehmicky/normalize-node-version):
  Normalize and validate Node.js versions
- [`fetch-node-website`](https://github.com/ehmicky/fetch-node-website): Fetch
  releases on nodejs.org

# Support

If you found a bug or would like a new feature, _don't hesitate_ to
[submit an issue on GitHub](../../issues).

For other questions, feel free to
[chat with us on Gitter](https://gitter.im/ehmicky/all-node-versions).

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
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://twitter.com/ehmicky"><img src="https://avatars2.githubusercontent.com/u/8136211?v=4" width="100px;" alt="ehmicky"/><br /><sub><b>ehmicky</b></sub></a><br /><a href="https://github.com/ehmicky/all-node-versions/commits?author=ehmicky" title="Code">💻</a> <a href="#design-ehmicky" title="Design">🎨</a> <a href="#ideas-ehmicky" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ehmicky/all-node-versions/commits?author=ehmicky" title="Documentation">📖</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->
