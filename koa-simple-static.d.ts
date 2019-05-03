import { Middleware } from 'koa'

declare function simpleStatic (opts: {
  dir: string
  gzip?: boolean
  maxAge?: number
  extraHeaders?: object[]
}): Middleware

declare namespace simpleStatic {}
export = simpleStatic
