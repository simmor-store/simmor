import {RxState} from "./rxState"

export interface Action {
  rxState: RxState<any>
  context: any
  methodName: string
  args: any[]
}

// tslint:disable-next-line:ban-types
export const callAction = (method: Function, action: Action) => {
  let result: any
  action.rxState.updateState(() => {
    result = method.call(action.context, ...action.args)
  }, action)
  return result
}
