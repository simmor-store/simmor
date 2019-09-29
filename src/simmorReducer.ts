import {Draft} from "immer"
import {Middleware} from "./middleware"
import {SimmorReducerContext} from "./simmorReducerContext"
import {getMethodsNames} from "./utils/utils"

export interface Action {
  context: SimmorReducerContext<any>
  reducer: any
  // tslint:disable-next-line:ban-types
  method: Function
  methodName: string
  args: any[]
}

export const callAction = (action: Action, middleware: Middleware) => {
  return middleware(() => {
    let result: any
    action.context.updateState(() => {
      result = action.method.call(action.reducer, ...action.args)
    })
    return result
  })(action)
}

export class SimmorReducer<TState> {
  protected context!: SimmorReducerContext<TState>
  public middleware: Middleware = next => next
  public setContext(context: SimmorReducerContext<TState>) {
    this.context = context
  }
  get draft() {
    return this.context.draft
  }

  public updateState(recipe: (draft: Draft<TState>) => void) {
    this.context.updateState(recipe)
  }
}

const actionsAreWrappedSymbol = Symbol()

export interface ReducerOptions {
  middlewares: Middleware[]
}

export const defaultReducerOptions: ReducerOptions = {middlewares: []}

export function wrapReducerActions(
  // tslint:disable-next-line:ban-types
  target: Function,
) {
  const targetAny = target as any
  if (targetAny[actionsAreWrappedSymbol]) {
    return
  }
  targetAny[actionsAreWrappedSymbol] = true
  for (const propertyName of getMethodsNames(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(
      target.prototype,
      propertyName,
    )!

    const action = descriptor.value
    descriptor.value = function(...args: any[]) {
      const reducer = this as SimmorReducer<any>
      return callAction(
        {
          context: (this as any).context,
          reducer,
          method: action,
          methodName: propertyName,
          args,
        },
        reducer.middleware,
      )
    }
    Object.defineProperty(target.prototype, propertyName, descriptor)
  }
}
