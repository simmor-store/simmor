import {combineMiddlewaresWithGlobals, Middleware} from "./middleware"
import {createRxState, InitialState, RxState} from "./rxState"
import {
  defaultReducerOptions,
  ReducerOptions,
  SimmorReducer,
  wrapReducerActions,
} from "./simmorReducer"

export class ReducerStore<TState> extends SimmorReducer<TState> {
  private middleware: Middleware = next => next

  constructor(
    initialState: InitialState<TState>,
    private options: Partial<ReducerOptions> = {},
  ) {
    super()
    this.middleware = combineMiddlewaresWithGlobals({
      ...defaultReducerOptions,
      ...options,
    })
    this.setInitialState(initialState)
    wrapReducerActions(this.constructor)
  }

  public setInitialState(initialState: InitialState<TState>): this {
    const rxState = createRxState(
      initialState,
      this.middleware,
      this.options.name || this.constructor.name,
    )
    this.setRxState(rxState)
    return this
  }

  get state() {
    return this.rxState.state
  }

  get state$() {
    return this.rxState.state$
  }

  public slice<TKey extends keyof TState>(key: TKey): RxState<TState[TKey]> {
    return this.rxState.slice(key)
  }
}
