import {
  applyPatches,
  createDraft,
  Draft,
  finishDraft,
  Patch,
  PatchListener,
} from "immer"
import {BehaviorSubject, Observable, Subject} from "rxjs"
import {filter} from "rxjs/operators"
import {Action} from "./action"
import {Middleware} from "./middleware"
import {select} from "./utils/rx-utils"

export type InitialState<TState> = RxState<TState> | TState

export interface UpdateStateInfo {
  methodName?: string
  args?: any[]
  context?: this
}

export function isRxState<TState>(
  value: InitialState<TState>,
): value is RxState<TState> {
  return value instanceof RxState
}

export function createRxState<TState>(
  initialState: InitialState<TState>,
  middleware: Middleware,
  name: string,
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
  public readonly onDispose$ = new Subject()

  public dispose() {
    this.onDispose$.next()
  }

  public abstract updateState(
    recipe: (draft: Draft<TState>) => void,
    info?: UpdateStateInfo,
  ): void

  public abstract updateStateWithRollback(
    recipe: (draft: Draft<TState>) => void,
    info?: UpdateStateInfo,
  ): () => void

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

  get hasDraft() {
    return this.currentDraft !== undefined
  }

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
    name = "",
  ) {
    super()
    this.name = name
    this.subject$ = new BehaviorSubject(initialState)
    const newState = middleware(() => initialState)({
      rxState: this,
      args: [initialState],
      context: this,
      methodName: "constructor",
    })
    this.replaceState(newState)
  }

  private updateStateWithPatchListner(
    recipe: (draft: Draft<TState>) => void,
    info: UpdateStateInfo = {},
    listener?: PatchListener,
  ) {
    let topLevelUpdate = false
    if (!this.currentDraft) {
      this.currentDraft = createDraft(this.state)
      topLevelUpdate = true
    }

    const action: Action = {
      methodName: info.methodName || "updateState",
      context: info.context || this,
      args: info.args || [],
      rxState: this,
    }

    const newState = this.middleware(() => {
      recipe(this.currentDraft as any)
      if (topLevelUpdate) {
        return finishDraft(this.currentDraft, listener) as TState
      }
      if (listener) {
        this.refreshCurrentDraft(listener)
      }
      return this.state
    })(action)
    if (!topLevelUpdate) {
      return
    }
    this.currentDraft = undefined
    this.replaceState(newState)
  }

  public updateStateWithRollback(
    recipe: (draft: Draft<TState>) => void,
    info: UpdateStateInfo = {},
  ) {
    this.refreshCurrentDraft()
    let inversePatches: Patch[] = []
    this.updateStateWithPatchListner(recipe, info, (patches, invPatches) => {
      inversePatches = invPatches
    })
    return () => {
      this.updateState(draft => {
        applyPatches(draft, inversePatches)
      })
    }
  }

  public updateState(
    recipe: (draft: Draft<TState>) => void,
    info: UpdateStateInfo = {},
  ) {
    this.updateStateWithPatchListner(recipe, info)
  }

  public replaceState(newState: TState) {
    if (newState !== this.state) {
      this.subject$.next(newState)
    }
  }

  private refreshCurrentDraft(listener?: PatchListener) {
    if (!this.currentDraft) {
      return
    }
    const newState = finishDraft(this.currentDraft, listener) as TState
    this.currentDraft = createDraft(newState)
    return newState
  }

  public commitDraftChanges() {
    const newState = this.refreshCurrentDraft()
    if (newState !== undefined) {
      this.replaceState(newState)
    }
  }

  public setState(state: TState) {
    this.updateState(
      draft => {
        for (const key of [...Object.keys(draft), ...Object.keys(state)]) {
          ;(draft as any)[key] = (state as any)[key]
        }
      },
      {
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

  public updateStateWithRollback(
    recipe: (draft: Draft<TParentState[TKey]>) => void,
    info: UpdateStateInfo = {},
  ) {
    return this.parent.updateStateWithRollback(() => {
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
