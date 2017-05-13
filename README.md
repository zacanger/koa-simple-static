# Koa Simple Static

Simple caching static file server for Koa 2.

--------

This is a fork of [koa-static-cache](https://github.com/koajs/static-cache), with simpler options.

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

## Contributing

* Please do, if you want! I'll consider any PRs, but no promises.
* Notes:
  * This project uses Flow.
  * It will be easiest if you have your editor configured to work with `eslint`
    and `flow`.
  * Please run tests!
  * Please _add_ tests, if you're adding functionality.
  * The top item on my todo-list here is moving all the tests to just use `tape`
    (with `babel-tape-runner`).

## License

[MIT](./LICENSE.md)
