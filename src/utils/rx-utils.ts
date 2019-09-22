import {OperatorFunction} from "rxjs"
import {distinctUntilChanged, map} from "rxjs/operators"
import {shallowEqual} from "./shallow-equal"

export function select<T, R>(
  project: (value: T, index: number) => R,
): OperatorFunction<T, R> {
  return source =>
    source.pipe(
      map(project),
      distinctUntilChanged(shallowEqual),
    )
}
