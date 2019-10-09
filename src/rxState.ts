import {createDraft, Draft, finishDraft} from "immer"
import {BehaviorSubject, Observable} from "rxjs"
import {filter} from "rxjs/operators"
import {Action} from "./action"
import {Middleware} from "./middleware"
import {select} from "./utils/rx-utils"

export type InitialState<TState> = RxState<TState> | TState

export interface UpdateStateInfo {
  methodName?: string,
  args?: any[],
  context?: this,
}

export function isRxState<TState>(
  value: InitialState<TState>,
): value is RxState<TState> {
  return value instanceof RxState
}

export function createRxState<TState>(
  initialState: InitialState<TState>,
  middleware: Middleware,
  name: string
) {
  return isRxState(initialState)
    ? initialState
    : new RxRootState(initialState, middleware, name)
}

export abstract class RxState<TState> {
  public name = ""
  abstract get state$(): Observable<TState>
  abstract get state(): TState
  abstract get draft(): Draft<TState>
  public initialState!: TState

  public abstract updateState(
    recipe: (draft: Draft<TState>) => void,
    info?: UpdateStateInfo,
  ): void

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

  constructor(
    readonly initialState: TState,
    readonly middleware: Middleware = next => next,
    name = ""
  ) {
    super()
    this.name = name
    this.subject$ = new BehaviorSubject(initialState)
    const newState = middleware(() => initialState)({
      rxState: this,
      args: [initialState],
      context: this,
      methodName: "constructor"
    })
    if (newState !== initialState) {
      this.subject$.next(newState)
    }
  }

  public updateState(recipe: (draft: Draft<TState>) => void, info: UpdateStateInfo = {}) {
    const action: Action = {
      methodName: info.methodName || "updateState",
      context: info.context || this,
      args: info.args || [],
      rxState: this,
    }
    let finish = false
    if (!this.currentDraft) {
      this.currentDraft = createDraft(this.state)
      finish = true
    }
    const newState = this.middleware(() => {
      recipe(this.currentDraft as any)
      return finish ? (finishDraft(this.currentDraft) as TState) : undefined
    })(action)
    if (!finish) {
      return
    }
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
      }, {
        methodName: "setState",
        args: [state],
      },
    )
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

  get state$(): Observable<TParentState[TKey]> {
    return this._state$
  }

  get state() {
    return this.parent.state[this.key]
  }

  constructor(readonly parent: RxState<TParentState>, private key: TKey) {
    super()
    this._state$ = parent.state$.pipe(
      select(x => x[key]),
      filter(x => x !== undefined),
    )
    this.name = `${this.parent.name}.${key}`
    this.initialState = this.parent.initialState[this.key]
  }

  public updateState(
    recipe: (draft: Draft<TParentState[TKey]>) => void,
    info?: UpdateStateInfo,
  ): void {
    this.parent.updateState(() => {
      recipe(this.draft)
    }, info)
  }

  public setState(state: TParentState[TKey]) {
    this.updateState(
      () => {
        this.parent.draft[this.key] = state as any
      },
      {
        methodName: "setState",
        args: [state],
      },
    )
  }
}
