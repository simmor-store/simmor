import {ActionData} from "./simmorReducer"

export type Middleware = (
  next: (data: ActionData) => any,
) => (data: ActionData) => void

export function combineMiddleware(middlewares: Middleware[]): Middleware {
  if (middlewares.length == 0) {
    return next => next
  }

  if (middlewares.length == 1) {
    return middlewares[0]
  }

  return middlewares.reduce((t, b) => next => t(b(next)))
}
