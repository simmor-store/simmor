import {globalConfig} from "./globalConfig"
import {Action, ReducerOptions} from "./simmorReducer"

export type Middleware = (next: (data: Action) => any) => (data: Action) => void

export function combineMiddlewares(middlewares: Middleware[]): Middleware {
  if (middlewares.length == 0) {
    return next => next
  }

  if (middlewares.length == 1) {
    return middlewares[0]
  }

  return middlewares.reduce((t, b) => next => t(b(next)))
}

export function combineMiddlewaresWithGlobals(options: ReducerOptions) {
  return combineMiddlewares([
    ...globalConfig.middlewares,
    ...options.middlewares,
  ])
}
