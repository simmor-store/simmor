import {Middleware} from "../src/middleware"
import {ReducerStore} from "../src/reducerStore"

const log: string[] = []

const testMiddleware: (name: string) => Middleware = name => next => data => {
  log.push(`${name}_${data.methodName}_1`)
  const r = next(data)
  log.push(`${name}_${data.methodName}_2`)
  return r
}

export class TestStore extends ReducerStore<{value: number}> {
  constructor() {
    super({value: 1}, {middlewares: [testMiddleware("1"), testMiddleware("2")]})
  }

  public bar() {
    this.draft.value = 1
  }

  public foo(){
    this.updateState(draft => {
      draft.value = 2
    })
  }

}

beforeEach(() => {
  log.length = 0
})

it("middleware", () => {
  const store = new TestStore()
  log.length = 0
  store.bar()
  expect(log.join(" ")).toEqual("1_bar_1 2_bar_1 2_bar_2 1_bar_2")
})

it("middleware constructor", () => {
  const store = new TestStore()
  expect(log.join(" ")).toEqual("1_constructor_1 2_constructor_1 2_constructor_2 1_constructor_2")
})

it("middleware updateState", () => {
  const store = new TestStore()
  log.length = 0
  store.foo()
  expect(log.join(" ")).toEqual("1_foo_1 2_foo_1 1_updateState_1 2_updateState_1 2_updateState_2 1_updateState_2 2_foo_2 1_foo_2")
})
