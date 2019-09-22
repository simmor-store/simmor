import {Draft} from "immer"
import {globalConfig} from "./globalConfig"
import {combineMiddleware, Middleware} from "./middleware"
import {SimmorReducerContext} from "./simmorReducerContext"
import {Constructor, getMethodsNames} from "./utils/utils"

export interface ActionData {
  context: SimmorReducerContext<any>
  reducer: any
  // tslint:disable-next-line:ban-types
  action: Function
  actionName: string
  args: any[]
}

export const callAction = (actionData: ActionData, middleware: Middleware) => {
  return middleware(() => {
    let result: any
    actionData.context.updateState(() => {
      result = actionData.action.call(actionData.reducer, ...actionData.args)
    })
    return result
  })(actionData)
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

const actionsWereWrapped = Symbol()

export interface ReducerOptions {
  middlewares: Middleware[]
}

export const defaultOptions: ReducerOptions = {middlewares: []}

export function Reducer(options = defaultOptions) {
  return <T extends Constructor<any>>(constructor: T) => {
    wrapReducerActions(constructor, options)
  }
}

export function combineAllMiddleware(options: ReducerOptions) {
  return combineMiddleware([
    ...globalConfig.middlewares,
    ...options.middlewares,
  ])
}

// tslint:disable-next-line:ban-types
export function wrapReducerActions(target: Function, options = defaultOptions) {
  const targetAny = target as any
  if (targetAny[actionsWereWrapped]) {
    return
  }
  const middleware = combineAllMiddleware(options)
  targetAny[actionsWereWrapped] = true
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
          action,
          args,
          actionName: propertyName,
        },
        middleware,
      )
    }
    Object.defineProperty(target.prototype, propertyName, descriptor)
  }
}
