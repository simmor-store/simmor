import {createRxState, InitialState, RxState} from "./rxState"
import {
  combineAllMiddleware,
  defaultOptions,
  SimmorReducer,
  wrapReducerActions,
} from "./simmorReducer"
import {SimmorReducerContext} from "./simmorReducerContext"

export class ReducerStore<TState> extends SimmorReducer<TState> {
  private _rxState!: RxState<TState>

  constructor(initialState: TState, options = defaultOptions) {
    super()
    this.setInitialState(initialState)
    this._rxState.name = this.constructor.name
    wrapReducerActions(this.constructor, options)
    const middleware = combineAllMiddleware(options)
    middleware(() => undefined)({
      action: this.constructor,
      actionName: "CREATED",
      reducer: this,
      args: [],
      context: this.context,
    })
  }

  get rxState() {
    return this._rxState
  }

  public setInitialState(initialState: InitialState<TState>): this {
    const rxState = createRxState(initialState)
    this._rxState = rxState
    this.setContext(new SimmorReducerContext(rxState))
    return this
  }

  get state() {
    return this.rxState.state
  }

  get state$() {
    return this.rxState.state$
  }
}
