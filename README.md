# Koa Simple Static

Simple caching static file server for Koa 2.

--------

Fork of [koa-static-cache](https://github.com/koajs/static-cache) with better
options.

## Installation

```
npm i -S koa-simple-static
```

## Usage

```javascript
app.use(serve({
  dir: process.cwd()
}))
```

### Options

* `dir: str` &mdash; directory you want to serve
* `maxAge: ?number = 0` &mdash; cache control max age (in seconds)
* `gzip: ?bool = false` &mdash; compress with gzip when request's `accept-encoding` includes gzip
* `extraHeaders: ?Object[]` &mdash; any extra headers you wish to set for requests served by this module
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
  gzip: true,
  extraHeaders: [ { 'X-Something-Whatever': 'foo, bar' } ]
}))

app.listen(port)
console.log(`Serving on ${port}!`)
```

## FAQ

* Why is this a thing?
  * Because I didn't like the existing options. Before this module, you could
    have a static file server for Koa with good defaults that didn't cache, or
    one that did cache with weird defaults (like not falling back to
    `index.html`). Now, you can have the good parts of both.
* I'm getting errors but my code is fine?
  * If you're on Node pre-8.0.0, you'll need to use Babel in front of your server.
  Example:
    ```javascript
    require('babel-register')({
      babelrc: false,
      presets: [ require('babel-preset-latest-minimal') ]
    })
    require('./server')
    ```
  * I recommend using `babel-register` in development and compiling for
    production.
* Is this production-ready?
  * Yes.

## Contributing

* Please do, if you want! I'll consider any PRs, but no promises.
* Notes:
  * This project uses Flow.
  * It will be easiest if you have your editor configured to work with `eslint`
    and `flow`.
  * Please run tests!
  * Please _add_ tests, if you're adding functionality.
    * But also, think really hard about adding any functionality. This is
      already complete.
  * My top priorities right now:
    * Using Node's `zlib` and `fs` (maybe with `util.promisify`) instead of `mz`

## License

[MIT](./LICENSE.md)
