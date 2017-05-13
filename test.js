import test from 'tape'
import fs from 'fs'
import crypto from 'crypto'
import zlib from 'zlib'
import request from 'supertest'
import Koa from 'koa'
import http from 'http'
import path from 'path'
import staticCache from './src'

const jsType = 'application/javascript; charset=utf-8'

const app = new Koa()
app.use(staticCache({
  dir: '.'
}))
const server = http.createServer(app.callback())

const app2 = new Koa()
app2.use(staticCache({
  dir: '.',
  buffer: true
}))
const server2 = http.createServer(app2.callback())

const app3 = new Koa()
app3.use(staticCache({
  dir: '.',
  buffer: true,
  gzip: true
}))
const server3 = http.createServer(app3.callback())

const app4 = new Koa()
app4.use(staticCache({
  dir: '.',
  gzip: true
}))
const server4 = http.createServer(app4.callback())

test.skip('should accept abnormal path', (t) => {
  const app = new Koa()
  app.use(staticCache({
    dir: path.resolve(__dirname)
  }))
  request(app.listen())
    .get('//src/index.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.end()
    })
})

let etag
test('should serve files', (t) => {
  request(server)
    .get('/src/index.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.equal(res.header['cache-control'], 'public, max-age=0')
      t.equal(res.header['content-type'], jsType)
      t.ok(res.header['content-length'])
      t.ok(res.header['last-modified'])
      t.ok(res.header['etag'])
      etag = res.headers.etag
      t.end()
    })
})

test('should serve files as buffers', (t) => {
  request(server2)
    .get('/src/index.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.equal(res.header['cache-control'], 'public, max-age=0')
      t.equal(res.header['content-type'], jsType)
      t.ok(res.header['content-length'])
      t.ok(res.header['last-modified'])
      t.ok(res.header['etag'])
      etag = res.headers.etag
      t.end()
    })
})

test('should serve recursive files', (t) => {
  request(server)
    .get('/src/index.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.equal(res.header['cache-control'], 'public, max-age=0')
      t.equal(res.header['content-type'], jsType)
      t.ok(res.header['content-length'])
      t.ok(res.header['last-modified'])
      t.ok(res.header['etag'])
      t.end()
    })
})

test('should not serve hidden files', (t) => {
  request(server)
    .get('/.gitignore')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(404, res.status)
      t.end()
    })
})

test('should support conditional HEAD requests', (t) => {
  request(server)
    .head('/src/index.js')
    .set('If-None-Match', etag)
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(304, res.status)
      t.end()
    })
})

test('should support conditional GET requests', (t) => {
  request(server)
    .get('/src/index.js')
    .set('If-None-Match', etag)
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(304, res.status)
      t.end()
    })
})

test('should support HEAD', (t) => {
  request(server)
    .head('/src/index.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.deepEqual({}, res.body)
      t.end()
    })
})

test('should support 404 Not Found for other Methods to allow downstream', (t) => {
  request(server)
    .put('/src/index.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(404, res.status)
      t.end()
    })
})

test('should ignore query strings', (t) => {
  request(server)
    .get('/src/index.js?query=string')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.end()
    })
})

test('should set the etag and content-md5 headers', (t) => {
  const pk = fs.readFileSync('package.json')
  const md5 = crypto.createHash('md5').update(pk).digest('base64')

  request(server)
    .get('/package.json')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      t.equal(res.header['etag'], `"${md5}"`)
      t.equal(res.header['content-md5'], md5)
      t.end()
    })
})

test('should serve files with gzip buffer', (t) => {
  const index = fs.readFileSync('src/index.js')
  zlib.gzip(index, (err, content) => {
    if (err) throw err
    request(server3)
      .get('/src/index.js')
      .set('Accept-Encoding', 'gzip')
      .end((err, res) => {
        if (err) throw err
        t.deepEqual(200, res.status)
        t.ok(index.toString())
        t.equal(res.header['vary'], 'Accept-Encoding')
        t.equal(res.header['content-length'], `${content.length}`)
        t.equal(res.header['content-encoding'], 'gzip')
        t.equal(res.header['cache-control'], 'public, max-age=0')
        t.equal(res.header['content-type'], jsType)
        t.ok(res.header['content-length'])
        t.ok(res.header['last-modified'])
        t.ok(res.header['etag'])
        etag = res.headers.etag
        t.end()
      })
  })
})

test('should not serve files with gzip buffer when accept encoding not include gzip', (t) => {
  const index = fs.readFileSync('src/index.js')
  request(server3)
    .get('/src/index.js')
    .set('Accept-Encoding', '')
    .end((err, res) => {
      if (err) throw err
      t.equal(res.header['content-type'], jsType)
      t.deepEqual(200, res.status)
      t.ok(index.toString())
      t.equal(res.header['cache-control'], 'public, max-age=0')
      t.equal(res.header['content-length'], `${index.length}`)
      t.notOk(res.header['content-encoding'])
      t.ok(res.header['content-length'])
      t.ok(res.header['last-modified'])
      t.ok(res.header['etag'])
      t.end()
    })
})

test('should serve files with gzip stream', (t) => {
  const index = fs.readFileSync('src/index.js')
  zlib.gzip(index, (err, content) => {
    if (err) throw err
    request(server4)
      .get('/src/index.js')
      .set('Accept-Encoding', 'gzip')
      .end((err, res) => {
        if (err) throw err
        t.equal(res.header['content-type'], jsType)
        t.equal(res.header['content-encoding'], 'gzip')
        t.deepEqual(200, res.status)
        t.ok(index.toString())
        t.equal(res.header['cache-control'], 'public, max-age=0')
        t.ok(res.header['last-modified'])
        t.ok(res.header['etag'])
        t.equal(res.header['vary'], 'Accept-Encoding')
        etag = res.headers.etag
        t.end()
      })
  })
})

test.skip('should work fine when new file added', (t) => {
  const app = new Koa()
  app.use(staticCache({ dir: '.', dynamic: true }))
  fs.writeFileSync('a.js', 'hello world')
  request(app.listen())
    .get('/a.js')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(200, res.status)
      fs.unlinkSync('a.js')
      t.end()
    })
})

test.skip('should 404 when url in dynamic mode', (t) => {
  const app = new Koa()
  app.use(staticCache({ dynamic: true, dir: '.' }))
  fs.writeFileSync('a.js', 'hello world')

  request(app.listen())
    .get('/a.js')
    .expect(404, (err) => {
      if (err) throw err
      fs.unlinkSync('a.js')
      t.end()
    })
})

test.skip('should 404 when new hidden file added in dynamic mode', (t) => {
  const app = new Koa()
  app.use(staticCache({ dir: '.', dynamic: true }))
  fs.writeFileSync('.a.js', 'hello world')

  request(app.listen())
    .get('/.a.js')
    .expect(404, (err) => {
      if (err) throw err
      fs.unlinkSync('.a.js')
      t.end()
    })
})

test.skip('should 404 when file not exist in dynamic mode', (t) => {
  const app = new Koa()
  app.use(staticCache({ dir: '.', dynamic: true }))
  request(app.listen())
    .get('/a.js')
    .expect(404)
  t.end()
})

test.skip('should 404 when file not exist', (t) => {
  const app = new Koa()
  app.use(staticCache({ dir: '.', dynamic: true }))
  request(app.listen())
    .get('/a.js')
    .expect(404)
  t.end()
})

test.skip('should 404 when is folder in dynamic mode', (t) => {
  const a = new Koa()
  a.use(staticCache({ dir: '.', dynamic: true }))
  request(a.listen())
    .get('/src')
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(404, res.status)
      t.end()
    })
})
