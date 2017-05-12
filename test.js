import test from 'tape'
import fs from 'fs'
import crypto from 'crypto'
import zlib from 'zlib'
import request from 'supertest'
import should from 'should'
import Koa from 'koa'
import http from 'http'
import path from 'path'
import staticCache from './src'

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

describe('Static Cache', () => {
  it('should dir priority than options.dir', (done) => {
    var app = new Koa()
    app.use(staticCache(path.join(__dirname, '..'), {
      dir: __dirname
    }))
    var server = app.listen()
    request(server)
    .get('/index.js')
    .expect(200, done)
  })

  it('should default options.dir works fine', (done) => {
    var app = new Koa()
    app.use(staticCache({
      dir: path.join(__dirname, '..')
    }))
    var server = app.listen()
    request(server)
    .get('/index.js')
    .expect(200, done)
  })

  it('should accept abnormal path', (done) => {
    var app = new Koa()
    app.use(staticCache({
      dir: path.join(__dirname, '..')
    }))
    var server = app.listen()
    request(server)
    .get('//index.js')
    .expect(200, done)
  })

  it('should default process.cwd() works fine', (done) => {
    var app = new Koa()
    app.use(staticCache())
    var server = app.listen()
    request(server)
    .get('/index.js')
    .expect(200, done)
  })

  var etag
  it('should serve files', (done) => {
    request(server)
    .get('/index.js')
    .expect(200)
    .expect('Cache-Control', 'public, max-age=0')
    .expect('Content-Type', /javascript/)
    .end((err, res) => {
      if (err) return done(err)

      res.should.have.header('Content-Length')
      res.should.have.header('Last-Modified')
      res.should.have.header('ETag')
      etag = res.headers.etag

      done()
    })
  })

  it('should serve files as buffers', (done) => {
    request(server2)
    .get('/index.js')
    .expect(200)
    .expect('Cache-Control', 'public, max-age=0')
    .expect('Content-Type', /javascript/)
    .end((err, res) => {
      if (err) return done(err)

      res.should.have.header('Content-Length')
      res.should.have.header('Last-Modified')
      res.should.have.header('ETag')

      etag = res.headers.etag

      done()
    })
  })

  it('should serve recursive files', (done) => {
    request(server)
    .get('/test/index.js')
    .expect(200)
    .expect('Cache-Control', 'public, max-age=0')
    .expect('Content-Type', /javascript/)
    .end((err, res) => {
      if (err) return done(err)

      res.should.have.header('Content-Length')
      res.should.have.header('Last-Modified')
      res.should.have.header('ETag')

      done()
    })
  })

  it('should not serve hidden files', (done) => {
    request(server)
    .get('/.gitignore')
    .expect(404, done)
  })

  it('should support conditional HEAD requests', (done) => {
    request(server)
    .head('/index.js')
    .set('If-None-Match', etag)
    .expect(304, done)
  })

  it('should support conditional GET requests', (done) => {
    request(server)
    .get('/index.js')
    .set('If-None-Match', etag)
    .expect(304, done)
  })

  it('should support HEAD', (done) => {
    request(server)
    .head('/index.js')
    .expect(200)
    .expect('', done)
  })

  it('should support 404 Not Found for other Methods to allow downstream', (done) => {
    request(server)
    .put('/index.js')
    .expect(404, done)
  })

  it('should ignore query strings', (done) => {
    request(server)
    .get('/index.js?query=string')
    .expect(200, done)
  })

  it('should set the etag and content-md5 headers', (done) => {
    var pk = fs.readFileSync('package.json')
    var md5 = crypto.createHash('md5').update(pk).digest('base64')

    request(server)
    .get('/package.json')
    .expect('ETag', '"' + md5 + '"')
    .expect('Content-MD5', md5)
    .expect(200, done)
  })

  it('should set Last-Modified if file modified and not buffered', (done) => {
    setTimeout(() => {
      var readme = fs.readFileSync('README.md', 'utf8')
      fs.writeFileSync('README.md', readme, 'utf8')
      var mtime = fs.statSync('README.md').mtime
      var md5 = files['/README.md'].md5
      request(server)
      .get('/README.md')
      .expect(200, (err, res) => {
        res.should.have.header('Content-Length')
        res.should.have.header('Last-Modified')
        res.should.not.have.header('ETag')
        files['/README.md'].mtime.should.eql(mtime)
        setTimeout(() => {
          files['/README.md'].md5.should.equal(md5)
        }, 10)
        done()
      })
    }, 1000)
  })

  it('should serve files with gzip buffer', (done) => {
    var index = fs.readFileSync('index.js')
    zlib.gzip(index, (err, content) => {
      request(server3)
      .get('/index.js')
      .set('Accept-Encoding', 'gzip')
      .expect(200)
      .expect('Cache-Control', 'public, max-age=0')
      .expect('Content-Encoding', 'gzip')
      .expect('Content-Type', /javascript/)
      .expect('Content-Length', content.length)
      .expect('Vary', 'Accept-Encoding')
      .expect(index.toString())
      .end((err, res) => {
        if (err) return done(err)

        res.should.have.header('Content-Length')
        res.should.have.header('Last-Modified')
        res.should.have.header('ETag')

        etag = res.headers.etag

        done()
      })
    })
  })

  it('should not serve files with gzip buffer when accept encoding not include gzip', (done) => {
    var index = fs.readFileSync('index.js')
    request(server3)
    .get('/index.js')
    .set('Accept-Encoding', '')
    .expect(200)
    .expect('Cache-Control', 'public, max-age=0')
    .expect('Content-Type', /javascript/)
    .expect('Content-Length', index.length)
    .expect('Vary', 'Accept-Encoding')
    .expect(index.toString())
    .end((err, res) => {
      if (err) return done(err)

      res.should.not.have.header('Content-Encoding')
      res.should.have.header('Content-Length')
      res.should.have.header('Last-Modified')
      res.should.have.header('ETag')
      done()
    })
  })

  it('should serve files with gzip stream', (done) => {
    var index = fs.readFileSync('index.js')
    zlib.gzip(index, (err, content) => {
      request(server4)
      .get('/index.js')
      .set('Accept-Encoding', 'gzip')
      .expect(200)
      .expect('Cache-Control', 'public, max-age=0')
      .expect('Content-Encoding', 'gzip')
      .expect('Content-Type', /javascript/)
      .expect('Vary', 'Accept-Encoding')
      .expect(index.toString())
      .end((err, res) => {
        if (err) return done(err)

        res.should.not.have.header('Content-Length')
        res.should.have.header('Last-Modified')
        res.should.have.header('ETag')

        etag = res.headers.etag

        done()
      })
    })
  })

  it('should 404 when dynamic = false', (done) => {
    var app = new Koa()
    app.use(staticCache({dynamic: false}))
    var server = app.listen()
    fs.writeFileSync('a.js', 'hello world')

    request(server)
      .get('/a.js')
      .expect(404, (err) => {
        fs.unlinkSync('a.js')
        done(err)
      })
  })

  it('should work fine when new file added in dynamic mode', (done) => {
    var app = new Koa()
    app.use(staticCache({ dir: '.', dynamic: true }))
    var server = app.listen()
    fs.writeFileSync('a.js', 'hello world')

    request(server)
      .get('/a.js')
      .expect(200, (err) => {
        fs.unlinkSync('a.js')
        done(err)
      })
  })

  it('should 404 when url in dynamic mode', (done) => {
    var app = new Koa()
    app.use(staticCache({ dynamic: true, dir: '.' }))
    var server = app.listen()
    fs.writeFileSync('a.js', 'hello world')

    request(server)
      .get('/a.js')
      .expect(404, (err) => {
        fs.unlinkSync('a.js')
        done(err)
      })
  })

  it('should 404 when new hidden file added in dynamic mode', (done) => {
    var app = new Koa()
    app.use(staticCache({ dir: '.', dynamic: true }))
    var server = app.listen()
    fs.writeFileSync('.a.js', 'hello world')

    request(server)
      .get('/.a.js')
      .expect(404, (err) => {
        fs.unlinkSync('.a.js')
        done(err)
      })
  })

  it('should 404 when file not exist in dynamic mode', (done) => {
    var app = new Koa()
    app.use(staticCache({ dir: '.', dynamic: true }))
    var server = app.listen()
    request(server)
      .get('/a.js')
      .expect(404, done)
  })

  it('should 404 when file not exist', (done) => {
    var app = new Koa()
    app.use(staticCache({ dir: '.', dynamic: true }))
    var server = app.listen()
    request(server)
      .get('/a.js')
      .expect(404, done)
  })

  it('should 404 when is folder in dynamic mode', (done) => {
    var app = new Koa()
    app.use(staticCache({ dir: '.', dynamic: true }))
    var server = app.listen()
    request(server)
      .get('/test')
      .expect(404, done)
  })

  it('should array options.filter works fine', (done) => {
    var app = new Koa()
    app.use(staticCache({
      dir: path.join(__dirname, '..'),
      filter: ['index.js']
    }))
    var server = app.listen()
    request(server)
    .get('/Makefile')
    .expect(404, done)
  })

  it('should function options.filter works fine', (done) => {
    var app = new Koa()
    app.use(staticCache({
      dir: path.join(__dirname, '..')
    }))
    var server = app.listen()
    request(server)
    .get('/Makefile')
    .expect(404, done)
  })

  it('should options.dynamic and options.preload works fine', (done) => {
    var app = new Koa()
    var files = {}
    app.use(staticCache({
      dir: path.join(__dirname, '..'),
      preload: false,
      dynamic: true
    }))
    files.should.eql({})
    request(app.listen())
      .get('/Makefile')
      .expect(200, (err, res) => {
        should.not.exist(err)
        files.should.have.keys('/Makefile')
        done()
      })
  })
})
