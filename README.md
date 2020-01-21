# Koa Simple Static

Simple caching static file server for Koa 2.

[![CircleCI](https://circleci.com/gh/zacanger/koa-simple-static.svg?style=svg)](https://circleci.com/gh/zacanger/koa-simple-static) [![codecov](https://codecov.io/gh/zacanger/koa-simple-static/branch/master/graph/badge.svg)](https://codecov.io/gh/zacanger/koa-simple-static) [![Maintainability](https://api.codeclimate.com/v1/badges/56ce56310829afe0d717/maintainability)](https://codeclimate.com/github/zacanger/koa-simple-static/maintainability) [![Known Vulnerabilities](https://snyk.io/test/github/zacanger/koa-simple-static/badge.svg)](https://snyk.io/test/github/zacanger/koa-simple-static) [![ko-fi](https://img.shields.io/badge/donate-KoFi-yellow.svg)](https://ko-fi.com/U7U2110VB) [![Patreon](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/zacanger) [![Support with PayPal](https://img.shields.io/badge/paypal-donate-yellow.png)](https://paypal.me/zacanger)

--------

Fork of [koa-static-cache](https://github.com/koajs/static-cache) with simpler
options:

* Caches: preloads files and dynamically loads new ones if found
* Falls back to `/index.html` if available
* Gzips if request's `accept-encoding` includes gzip
* Accepts extra headers for served files

## Installation

```
npm i koa-simple-static
```

## Usage

```javascript
app.use(serve({
  dir: process.cwd()
}))
```

### Options

* `dir: string` &mdash; directory you want to serve
* `maxAge?: number = 0` &mdash; cache control max age (in seconds)
* `extraHeaders?: Object[]` &mdash; any extra headers you wish to set for requests served by this module
  * The format for this is `[ { 'Link': '</foo.js>; rel=preload; as=script' }, { 'Set-Cookie': 'foo=bar; path=/;' } ]`

### Example

```javascript
import serve from 'koa-simple-static'
import { resolve } from 'path'
import Koa from 'koa'

const app = new Koa()
const port = process.env.PORT || 4444

app.use(serve({
  dir: resolve(__dirname, 'public'),
  extraHeaders: [ { 'X-Something-Whatever': 'foo, bar' } ]
}))

app.listen(port, () => {
  console.log(`Serving on ${port}!`)
})
```

**Important** if you're using `require`, you'll need to
`require('koa-simple-static').default`.

## FAQ

* How is this different from other options?
  * Before this module, you could have a static file server for Koa with good
    defaults that didn't cache, or one that did cache with weird defaults (like
    not falling back to `index.html`). Now, you can have the good parts of both.
* I'm getting errors but my code is fine?
  * How old is your version of Node? You'll need to be on the versions supported
    in the `engines` field, or else Babelify or otherwise compile your server.

## Contributing

* Issues and PRs are welcome! Please keep in mind that this is feature complete.
* This project uses TypeScript. It will be easiest if your editor is configured to
  work with `eslint` and `tsc`.
* Please run tests!
* If you're changing or adding functionality, please _add_ tests!

[LICENSE](./LICENSE.md)
