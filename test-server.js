const Koa = require('koa')
new Koa().use(require('.').default({ dir: '.' })).listen(5555)
