// @flow

import { createHash } from 'crypto'
import { normalize, join, basename, sep } from 'path'
import { createReadStream, statSync, readFileSync } from 'mz/fs'
import { gzip, createGzip } from 'mz/zlib'
import { lookup } from 'mime-types'
import compressible from 'compressible'
import readDir from 'fs-readdir-recursive'
import type { Context } from 'koa'
import { safeDecodeURIComponent } from 'zeelib'

type Next = () => Promise<any>

const loadFile = (
  name: string,
  dir: string,
  options: Object,
  files: Object
): Object => {
  const pathname = normalize(join(options.prefix, name))
  const obj = files[pathname] = files[pathname] ? files[pathname] : {}
  const filename = obj.path = join(dir, name)
  const stats = statSync(filename)
  let buffer = readFileSync(filename)

  obj.cacheControl = options.cacheControl
  obj.maxAge = obj.maxAge ? obj.maxAge : options.maxAge || 0
  obj.type = obj.mime = lookup(pathname) || 'application/octet-stream'
  obj.mtime = stats.mtime
  obj.length = stats.size
  obj.md5 = createHash('md5').update(buffer).digest('base64')
  obj.buffer = buffer
  buffer = null
  return obj
}

type Opts = {
  dir: string,
  extraHeaders: ?Object[],
  prefix: ?string,
  maxAge: ?number
}

const simpleStatic = (options: Opts) => {
  const dir = normalize(options.dir)
  options.prefix = '/'
  const files = {}

  readDir(dir).forEach((name) => {
    loadFile(name, dir, options, files)
  })

  return async (ctx: Context, next: Next) => {
    // only accept HEAD and GET
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
      await next()
      return
    }

    // check prefix first to avoid calculate
    if (ctx.path.indexOf(options.prefix) !== 0) {
      await next()
      return
    }

    if (
      options.extraHeaders &&
      Array.isArray(options.extraHeaders) &&
      options.extraHeaders.length
    ) {
      options.extraHeaders.forEach((header) => {
        for (let h in header) {
          ctx.append(h, header[h])
        }
      })
    }

    // decode for `/%E4%B8%AD%E6%96%87`
    // normalize for `//index`
    let filename = safeDecodeURIComponent(normalize(ctx.path))

    let file = files[filename]

    // try to load file
    if (!file) {
      if (basename(filename)[0] === '.') {
        await next()
        return
      }

      // handle index.html
      let hasIndex
      try {
        hasIndex = await statSync(normalize(join(dir, `${filename}/index.html`))).isFile()
      } catch (_) { }
      if (hasIndex) {
        filename = `${filename}/index.html`
      }

      if (filename.charAt(0) === sep) {
        filename = filename.slice(1)
      }

      // disallow ../
      const fullPath = join(dir, filename)
      if (fullPath.indexOf(dir) !== 0 && fullPath !== 'index.html') {
        await next()
        return
      }

      let s
      try {
        s = await statSync(join(dir, filename))
      } catch (err) {
        await next()
        return
      }
      if (!s.isFile()) {
        await next()
        return
      }

      file = loadFile(filename, dir, options, files)
    }

    ctx.status = 200
    ctx.vary('Accept-Encoding')

    if (!file.buffer) {
      const stats = await statSync(file.path)
      if (stats.mtime > file.mtime) {
        file.mtime = stats.mtime
        file.md5 = null
        file.length = stats.size
      }
    }

    ctx.response.lastModified = file.mtime

    if (file.md5) {
      ctx.response.etag = file.md5
    }

    if (ctx.fresh) {
      ctx.status = 304
      return
    }

    ctx.type = file.type
    ctx.length = file.zipBuffer ? file.zipBuffer.length : file.length
    ctx.set('cache-control', `public, max-age=${file.maxAge}`)

    if (file.md5) {
      ctx.set('content-md5', file.md5)
    }

    if (ctx.method === 'HEAD') {
      return
    }

    const acceptGzip = ctx.acceptsEncodings('gzip') === 'gzip'

    if (file.zipBuffer) {
      if (acceptGzip) {
        ctx.set('content-encoding', 'gzip')
        ctx.body = file.zipBuffer
      } else {
        ctx.body = file.buffer
      }
      return
    }

    const shouldGzip =
      file.length > 1024 &&
      acceptGzip &&
      compressible(file.type)

    if (file.buffer) {
      if (shouldGzip) {
        file.zipBuffer = await gzip(file.buffer)
        ctx.set('content-encoding', 'gzip')
        ctx.body = file.zipBuffer
      } else {
        ctx.body = file.buffer
      }
      return
    }

    const stream = await createReadStream(file.path)

    // update file hash
    if (!file.md5) {
      const hash = createHash('md5')
      stream.on('data', hash.update.bind(hash))
      stream.on('end', () => {
        file.md5 = hash.digest('base64')
      })
    }

    ctx.body = stream
    // enable gzip will remove content length
    if (shouldGzip) {
      ctx.remove('content-length')
      ctx.set('content-encoding', 'gzip')
      ctx.body = stream.pipe(createGzip())
    }
  }
}

export default simpleStatic
