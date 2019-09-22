import {createDraft, Draft, finishDraft} from "immer"
import {BehaviorSubject, Observable} from "rxjs"
import {select} from "./utils/rx-utils"

export type InitialState<TState> = RxState<TState> | TState

export function isRxState<TState>(
  value: InitialState<TState>,
): value is RxState<TState> {
  return value instanceof RxState
}

export function createRxState<TState>(initialState: InitialState<TState>) {
  return isRxState(initialState) ? initialState : new RxRootState(initialState)
}

export abstract class RxState<TState> {
  public name = ""
  abstract get state$(): Observable<TState>
  abstract get state(): TState
  abstract get draft(): Draft<TState>
  public initialState!: TState

  public abstract updateState(recipe: (draft: Draft<TState>) => void): void

  public abstract setState(state: TState): void

  public slice<TKey extends keyof TState>(key: TKey): RxState<TState[TKey]> {
    return new RxSliceState(this, key)
  }

  public reset() {
    this.setState(this.initialState)
  }
}

export class RxRootState<TState> extends RxState<TState> {
  private subject$: BehaviorSubject<TState>
  private currentDraft?: Draft<TState>

  get state() {
    return this.subject$.value
  }

  get state$() {
    return this.subject$
  }

  get draft(): Draft<TState> {
    if (this.currentDraft) {
      return this.currentDraft
    }
    throw new Error("draft doesn't exists")
  }

  constructor(readonly initialState: TState) {
    super()
    this.subject$ = new BehaviorSubject(initialState)
  }

  public updateState(recipe: (draft: Draft<TState>) => void) {
    let finish = false
    if (!this.currentDraft) {
      this.currentDraft = createDraft(this.state)
      finish = true
    }
    recipe(this.currentDraft)
    if (!finish) {
      return
    }
    const newState = finishDraft(this.currentDraft) as TState
    this.currentDraft = undefined
    if (newState !== this.state) {
      this.subject$.next(newState)
    }
  }

  public setState(state: TState) {
    this.updateState(draft => {
      for (const key of [...Object.keys(draft), ...Object.keys(state)]) {
        ;(draft as any)[key] = (state as any)[key]
      }
    })
  }
}

export class RxSliceState<
  TParentState,
  TKey extends keyof TParentState
> extends RxState<TParentState[TKey]> {
  private readonly _state$: Observable<TParentState[TKey]>

  get draft(): Draft<TParentState[TKey]> {
    return (this.parent.draft as any)[this.key]
  }

  get state$() {
    return this._state$
  }

  get state() {
    return this.parent.state[this.key]
  }

  constructor(private parent: RxState<TParentState>, private key: TKey) {
    super()
    this._state$ = parent.state$.pipe(select(x => x[key]))
    this.name = `${this.parent.name}.${key}`
    this.initialState = this.parent.initialState[this.key]
  }

  public updateState(recipe: (draft: Draft<TParentState[TKey]>) => void): void {
    this.parent.updateState(() => {
      recipe(this.draft)
    })
  }

  public setState(state: TParentState[TKey]) {
    this.updateState(() => {
      ;(this.parent.draft as any)[this.key] = state
    })
  }
}
