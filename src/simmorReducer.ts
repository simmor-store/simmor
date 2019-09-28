import {Draft} from "immer"
import {combineMiddlewaresWithGlobals, Middleware} from "./middleware"
import {SimmorReducerContext} from "./simmorReducerContext"
import {Constructor, getMethodsNames} from "./utils/utils"

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

const actionsAreWrapped = Symbol()

export interface ReducerOptions {
  middlewares: Middleware[]
}

export const defaultReducerOptions: ReducerOptions = {middlewares: []}

export function Reducer(options = defaultReducerOptions) {
  return <T extends Constructor<any>>(constructor: T) => {
    wrapReducerActions(constructor, options)
  }
}

// tslint:disable-next-line:ban-types
export function wrapReducerActions(
  target: Function,
  options = defaultReducerOptions,
) {
  const targetAny = target as any
  if (targetAny[actionsAreWrapped]) {
    return
  }
  targetAny[actionsAreWrapped] = true
  const middleware = combineMiddlewaresWithGlobals(options)
  for (const propertyName of getMethodsNames(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(
      target.prototype,
      propertyName,
    )!

    const action = descriptor.value
    descriptor.value = function(...args: any[]) {
      return callAction(
        {
          context: (this as any).context,
          reducer: this,
          method: action,
          methodName: propertyName,
          args,
        },
        middleware,
      )
    }
    Object.defineProperty(target.prototype, propertyName, descriptor)
  }
}
