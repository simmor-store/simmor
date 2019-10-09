import {Draft} from "immer"
import {RxState} from "./rxState"

export class LocalStoreContext<TState> {
  get draft(): Draft<TState> {
    return this.rxState.draft
  }

  constructor(public rxState: RxState<TState>) {}

  public updateState<T>(recipe: (draft: Draft<TState>) => T) {
    this.rxState.updateState(recipe, undefined)
  }
}
