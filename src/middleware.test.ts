import {Middleware} from "./middleware"
import {ReducerStore} from "./reducerStore"

const log: string[] = []

const testMiddleware: (name: string) => Middleware = name => next => data => {
  log.push(data.methodName)
  log.push(name + "_1")
  const r = next(data)
  log.push(name + "_2")
  return r + 1
}

export class TestStore extends ReducerStore<{value: number}> {
  constructor() {
    super({value: 1}, {middlewares: [testMiddleware("1"), testMiddleware("2")]})
  }
  public getValue() {
    return this.draft.value
  }
}

beforeEach(() => {
  log.length = 0
})

it("middleware constructor", () => {
  const store = new TestStore()
  expect(log.join(" ")).toEqual("constructor 1_1 constructor 2_1 2_2 1_2")
})

it("middleware", () => {
  const store = new TestStore()
  log.length = 0
  const value = store.getValue()
  expect(value).toEqual(3)
  expect(log.join(" ")).toEqual("getValue 1_1 getValue 2_1 2_2 1_2")
})
