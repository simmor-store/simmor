import {combineMiddlewares, combineMiddlewaresWithGlobals} from "./middleware"
import {createRxState, InitialState, RxState} from "./rxState"
import {callAction, defaultReducerOptions} from "./simmorReducer"
import {SimmorReducerContext} from "./simmorReducerContext"

export type Actions = Record<string, (...args: any[]) => any>

export type LocalReducer<TState, TActions extends Actions> = (
  ctx: SimmorReducerContext<TState>,
) => TActions

const wrapActions = <TState, TActions extends Actions>(
  context: SimmorReducerContext<TState>,
  actions: TActions,
  options = defaultReducerOptions
) => {
  const reducer = {} as any
  const keys = Object.keys(actions)
  for (const key of keys) {
    reducer[key] = (...args: any[]) => {
      return callAction(
        {context, reducer, method: actions[key], args, methodName: key},
        combineMiddlewares(options.middlewares),
      )
    }
  }
  return reducer as TActions
}

export function createLocalStore<TState, TActions extends Actions>(
  initialState: InitialState<TState>,
  reducer: LocalReducer<TState, TActions>,
  options = defaultReducerOptions
): {rxState: RxState<TState>, dispatch: TActions} {
  const rxState = createRxState(initialState)
  const context = new SimmorReducerContext(rxState)
  const actions = reducer(context)
  const dispatch = wrapActions(context, actions, options)

  const middleware = combineMiddlewaresWithGlobals(options)
  middleware(() => undefined)({
    method: reducer,
    methodName: "constructor",
    reducer: dispatch,
    args: [],
    context,
  })
  return {
    rxState,
    dispatch,
  }
}
