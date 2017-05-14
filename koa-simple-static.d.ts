import { Middleware } from 'koa'

declare function serve (opts: {
  dir: string
  gzip?: boolean
  maxAge?: number
  extraHeaders?: object[]
}): Middleware

declare namespace serve {}
export = serve
