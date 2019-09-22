import {combineMiddleware} from "./middleware"
import {createRxState, InitialState} from "./rxState"
import {callAction} from "./simmorReducer"
import {SimmorReducerContext} from "./simmorReducerContext"

type Actions = Record<string, any>
type LocalReducer<TState, TActions extends Actions> = (
  ctx: SimmorReducerContext<TState>,
) => TActions

const wrapActions = <TState, TActions extends Actions>(
  context: SimmorReducerContext<TState>,
  actions: TActions,
) => {
  const reducer = {} as any
  const keys = Object.keys(actions)
  for (const key of keys) {
    reducer[key] = (...args: any[]) => {
      return callAction(
        {context, reducer, action: actions[key], args, actionName: key},
        combineMiddleware([]),
      )
    }
  }
  return reducer as TActions
}

export function createLocalStore<TState, TActions extends Actions>(
  initialState: InitialState<TState>,
  reducer: LocalReducer<TState, TActions>,
) {
  const state = createRxState(initialState)
  const context = new SimmorReducerContext(state)
  const actions = reducer(context)
  const wrapped = wrapActions(context, actions)
  return {
    store: state,
    reducer: wrapped,
  }
}
