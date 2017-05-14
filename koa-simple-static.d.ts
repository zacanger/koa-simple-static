import { Middleware } from 'koa'

declare function serve (opts: {
  dir: string
  gzip?: boolean
  maxAge?: number
  extraHeaders?: Object[]
}): Middleware

declare namespace serve {}
export = serve
