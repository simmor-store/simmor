import {combineMiddlewaresWithGlobals} from "./middleware"
import {createRxState, InitialState, RxState} from "./rxState"
import {defaultReducerOptions, SimmorReducer, wrapReducerActions} from "./simmorReducer"
import {SimmorReducerContext} from "./simmorReducerContext"

export class ReducerStore<TState> extends SimmorReducer<TState> {
  private _rxState!: RxState<TState>

  constructor(
    initialState: InitialState<TState>,
    options = defaultReducerOptions,
  ) {
    super()
    this.setInitialState(initialState)
    this._rxState.name = this.constructor.name
    wrapReducerActions(this.constructor)
    this.middleware = combineMiddlewaresWithGlobals(options)
    this.middleware(() => undefined)({
      method: this.constructor,
      methodName: "constructor",
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
