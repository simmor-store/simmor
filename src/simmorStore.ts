import "rxjs"
import {createRxState, InitialState, RxState} from "./rxState"
import {SimmorReducer} from "./simmorReducer"

export class SimmorStore<TReducer extends SimmorReducer<TState>, TState> {
  private readonly reducer: TReducer
  private _rxState!: RxState<TState>

  constructor(reducer: TReducer, initialState: RxState<TState> | TState) {
    this.reducer = reducer
    this.setInitialState(initialState)
  }

  get rxState() {
    return this._rxState
  }

  public setInitialState(initialState: InitialState<TState>) {
    const rxState = createRxState(initialState, next => next, this.reducer.constructor.name)
    this._rxState = rxState
    this.reducer.setRxState(this._rxState)
  }

  get state() {
    return this.rxState.state
  }

  get state$() {
    return this.rxState.state$
  }
}
