# Koa Static Cache

Static server for Koa.

Differences between this library and other libraries such as [static](https://github.com/koajs/static):

- There is no directory or `index.html` support.
- You may optionally store the data in memory - it streams by default.
- Caches the assets on initialization - you need to restart the process to update the assets.(can turn off with options.preload = false)
- Uses MD5 hash sum as an ETag.

## Installation

```js
$ npm install koa-static-cache
```

## API

### staticCache(options)

```js
var path = require('path')
var staticCache = require('koa-static-cache')

app.use(staticCache({
  dir: path.resolve(__dirname, 'public'),
  maxAge: 365 * 24 * 60 * 60
}))
```

- `options.dir` (str) - the directory you wish to serve, default to `process.cwd`.
- `options.maxAge` (int) - cache control max age for the files, `0` by default.
- `options.cacheControl` (str) - optional cache control header. Overrides `options.maxAge`.
- `options.buffer` (bool) - store the files in memory instead of streaming from the filesystem on each request.
- `options.gzip` (bool) - when request's accept-encoding include gzip, files will compressed by gzip.
- `options.prefix` (str) - the url prefix you wish to add, default to `''`.
- `options.dynamic` (bool) - dynamic load file which not cached on initialization.
- `options.filter` (function | array) - filter files at init dir, for example - skip non build (source) files. If array set - allow only listed files
- `options.preload` (bool) - caches the assets on initialization or not, default to `true`. always work togather with `options.dynamic`.

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
