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

* `dir : str` &mdash; directory you want to serve
* `maxAge : ?number = 0` &mdash; cache control max age (in seconds)
* `gzip : ?bool = false` &mdash; compress with gzip when request's `accept-encoding` includes gzip
* `extraHeaders : ?Object[]` &mdash; any extra headers you wish to set for requests served by this module
  * The format for this is `[ { 'Link': '</foo.js>; rel=preload; as=script' }, { 'Set-Cookie': 'foo=bar; path=/;' } ]`

### Note

Right now, you need to rewrite `/` to `/index.html` manually. See example.

### Example

```javascript
import serve from 'koa-simple-static'
import { resolve } from 'path'
import Koa from 'koa'
import rewrite from 'koa-rewrite'

const app = new Koa()
const port = process.env.PORT || 4444

app.use(rewrite(/^\/$/, '/index.html'))
app.use(serve({
  dir: resolve(__dirname, 'public'),
  gzip: true,
  extraHeaders: [ { 'X-Something-Whatever': 'foo, bar' } ]
}))

app.listen(port)
console.log(`Serving on ${port}!`)
```

## Contributing

* Please do, if you want! I'll consider any PRs, but no promises.
* Notes:
  * This project uses Flow.
  * It will be easiest if you have your editor configured to work with `eslint`
    and `flow`.
  * Please run tests!
  * Please _add_ tests, if you're adding functionality.
  * My top priorities right now:
    * Using Node's `zlib` and `fs` instead of `mz`
    * Removing `regenerator`
    * Adding typings for TypeScript users
    * Adding `index.html` support

## License

[MIT](./LICENSE.md)
