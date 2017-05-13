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
import serve from 'koa-simple-static'
import { resolve } from 'path'
import Koa from 'koa'

const app = new Koa()

app.use(serve({
  dir: path.resolve(__dirname, 'public')
  // other options
}))
```

### Options

- `dir` (str) - the directory you wish to serve, default to `process.cwd`.
- `maxAge` (int) - cache control max age for the files, `0` by default.
- `cacheControl` (str) - optional cache control header. Overrides `options.maxAge`.
- `buffer` (bool) - store the files in memory instead of streaming from the filesystem on each request.
- `gzip` (bool) - when request's accept-encoding include gzip, files will compressed by gzip.
- `prefix` (str) - the url prefix you wish to add, default to `''`.
- `dynamic` (bool) - dynamic load file which not cached on initialization.
- `filter` (function | array) - filter files at init dir, for example - skip non build (source) files. If array set - allow only listed files
- `preload` (bool) - caches the assets on initialization or not, default to `true`. always work togather with `options.dynamic`.

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

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
