import {callAction} from "./action"
import {LocalStoreContext} from "./localStoreContext"
import {combineMiddlewaresWithGlobals} from "./middleware"
import {createRxState, InitialState, RxState} from "./rxState"
import {defaultReducerOptions} from "./simmorReducer"

export type Actions = Record<string, (...args: any[]) => any>

export type LocalReducer<TState, TActions extends Actions> = (
  ctx: LocalStoreContext<TState>,
) => TActions

const wrapActions = <TState, TActions extends Actions>(
  rxState: RxState<TState>,
  actions: TActions,
) => {
  const reducer = {} as any
  const keys = Object.keys(actions)
  for (const key of keys) {
    reducer[key] = (...args: any[]) => {
      return callAction(actions[key], {
        rxState,
        context: reducer,
        args,
        methodName: key,
      })
    }
  }
  return reducer as TActions
}

export function createLocalStore<TState, TActions extends Actions>(
  initialState: InitialState<TState>,
  reducer: LocalReducer<TState, TActions>,
  options = defaultReducerOptions,
): {rxState: RxState<TState>; dispatch: TActions} {
  const middleware = combineMiddlewaresWithGlobals(options)
  const rxState = createRxState(initialState, middleware, options.name)
  const context = new LocalStoreContext(rxState)
  const actions = reducer(context)
  const dispatch = wrapActions(rxState, actions)

  return {
    rxState,
    dispatch,
  }
}
