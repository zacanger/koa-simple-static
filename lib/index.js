'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crypto = require('crypto');

var _path = require('path');

var _fs = require('mz/fs');

var _zlib = require('mz/zlib');

var _mimeTypes = require('mime-types');

var _compressible = require('compressible');

var _compressible2 = _interopRequireDefault(_compressible);

var _fsReaddirRecursive = require('fs-readdir-recursive');

var _fsReaddirRecursive2 = _interopRequireDefault(_fsReaddirRecursive);

var _zeelib = require('zeelib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*:: import type { Context } from 'koa'*/ // @flow

/*:: type Next = () => Promise<any>*/


const loadFile = (name /*: string*/, dir /*: string*/, options /*: Object*/, files /*: Object*/) /*: Object*/ => {
  const pathname = (0, _path.normalize)((0, _path.join)(options.prefix, name));
  const obj = files[pathname] = files[pathname] ? files[pathname] : {};
  const filename = obj.path = (0, _path.join)(dir, name);
  const stats = (0, _fs.statSync)(filename);
  let buffer = (0, _fs.readFileSync)(filename);

  obj.cacheControl = options.cacheControl;
  obj.maxAge = obj.maxAge ? obj.maxAge : options.maxAge || 0;
  obj.type = obj.mime = (0, _mimeTypes.lookup)(pathname) || 'application/octet-stream';
  obj.mtime = stats.mtime;
  obj.length = stats.size;
  obj.md5 = (0, _crypto.createHash)('md5').update(buffer).digest('base64');
  obj.buffer = buffer;
  buffer = null;
  return obj;
};

/*:: type Opts = {
  dir: string,
  extraHeaders: ?Object[],
  gzip: ?bool,
  prefix: ?string,
  maxAge: ?number
}*/


const simpleStatic = (options /*: Opts*/) => {
  const dir = options.dir;
  options.prefix = '/';
  const files = {};
  const enableGzip = !!options.gzip;

  (0, _fsReaddirRecursive2.default)(dir).forEach(name => {
    loadFile(name, dir, options, files);
  });

  return async (ctx /*: Context*/, next /*: Next*/) => {
    // only accept HEAD and GET
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
      await next();
      return;
    }

    // check prefix first to avoid calculate
    if (ctx.path.indexOf(options.prefix) !== 0) {
      await next();
      return;
    }

    if (options.extraHeaders && Array.isArray(options.extraHeaders) && options.extraHeaders.length) {
      options.extraHeaders.forEach(header => {
        for (let h in header) {
          ctx.append(h, header[h]);
        }
      });
    }

    // decode for `/%E4%B8%AD%E6%96%87`
    // normalize for `//index`
    let filename = (0, _zeelib.safeDecodeURIComponent)((0, _path.normalize)(ctx.path));

    let file = files[filename];

    // try to load file
    if (!file) {
      if ((0, _path.basename)(filename)[0] === '.') {
        await next();
        return;
      }

      // handle index.html
      let hasIndex;
      try {
        hasIndex = await (0, _fs.statSync)((0, _path.normalize)((0, _path.join)(dir, `${filename}/index.html`))).isFile();
      } catch (_) {}
      if (hasIndex) {
        filename = `${filename}/index.html`;
      }

      if (filename.charAt(0) === _path.sep) {
        filename = filename.slice(1);
      }

      let s;
      try {
        s = await (0, _fs.statSync)((0, _path.join)(dir, filename));
      } catch (err) {
        await next();
        return;
      }
      if (!s.isFile()) {
        await next();
        return;
      }

      file = loadFile(filename, dir, options, files);
    }

    ctx.status = 200;

    if (enableGzip) {
      ctx.vary('Accept-Encoding');
    }

    if (!file.buffer) {
      const stats = await (0, _fs.statSync)(file.path);
      if (stats.mtime > file.mtime) {
        file.mtime = stats.mtime;
        file.md5 = null;
        file.length = stats.size;
      }
    }

    ctx.response.lastModified = file.mtime;

    if (file.md5) {
      ctx.response.etag = file.md5;
    }

    if (ctx.fresh) {
      ctx.status = 304;
      return;
    }

    ctx.type = file.type;
    ctx.length = file.zipBuffer ? file.zipBuffer.length : file.length;
    ctx.set('cache-control', `public, max-age=${file.maxAge}`);

    if (file.md5) {
      ctx.set('content-md5', file.md5);
    }

    if (ctx.method === 'HEAD') {
      return;
    }

    const acceptGzip = ctx.acceptsEncodings('gzip') === 'gzip';

    if (file.zipBuffer) {
      if (acceptGzip) {
        ctx.set('content-encoding', 'gzip');
        ctx.body = file.zipBuffer;
      } else {
        ctx.body = file.buffer;
      }
      return;
    }

    const shouldGzip = enableGzip && file.length > 1024 && acceptGzip && (0, _compressible2.default)(file.type);

    if (file.buffer) {
      if (shouldGzip) {
        file.zipBuffer = await (0, _zlib.gzip)(file.buffer);
        ctx.set('content-encoding', 'gzip');
        ctx.body = file.zipBuffer;
      } else {
        ctx.body = file.buffer;
      }
      return;
    }

    const stream = await (0, _fs.createReadStream)(file.path);

    // update file hash
    if (!file.md5) {
      const hash = (0, _crypto.createHash)('md5');
      stream.on('data', hash.update.bind(hash));
      stream.on('end', () => {
        file.md5 = hash.digest('base64');
      });
    }

    ctx.body = stream;
    // enable gzip will remove content length
    if (shouldGzip) {
      ctx.remove('content-length');
      ctx.set('content-encoding', 'gzip');
      ctx.body = stream.pipe((0, _zlib.createGzip)());
    }
  };
};

exports.default = simpleStatic;
