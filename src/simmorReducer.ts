import {Draft} from "immer"
import {callAction} from "./action"
import {Middleware} from "./middleware"
import {RxState} from "./rxState"
import {getMethodsNames} from "./utils/utils"

export class SimmorReducer<TState> {
  public rxState!: RxState<TState>
  public setRxState(rxState: RxState<TState>) {
    this.rxState = rxState
  }

  get draft() {
    return this.rxState.draft
  }

  public updateState(recipe: (draft: Draft<TState>) => void) {
    this.rxState.updateState(recipe, undefined)
  }
}

const actionsAreWrappedSymbol = Symbol()

export interface ReducerOptions {
  middlewares: Middleware[]
  name: string
}

export const defaultReducerOptions: ReducerOptions = {middlewares: [], name: ""}

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

    const method = descriptor.value
    descriptor.value = function(...args: any[]) {
      const reducer = this as SimmorReducer<any>
      return callAction(method, {
        rxState: reducer.rxState,
        context: reducer,
        methodName: propertyName,
        args,
      })
    }
    Object.defineProperty(target.prototype, propertyName, descriptor)
  }
}
