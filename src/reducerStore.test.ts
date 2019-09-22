import {ReducerStore} from "./reducerStore"

export class TestStore extends ReducerStore<{value: number}> {
  constructor() {
    super({value: 1})
  }
  increase() {
    this.draft.value += 1
  }

  doubleIncrease() {
    this.increase()
    this.increase()
  }

  withParameters(x: number, y: number) {
    this.draft.value = x + y
  }

  asyncIncrease() {
    return new Promise(resolve =>
      setTimeout(() => {
        this.increase()
        resolve()
      }),
    )
  }
}

export class TestStoreSlice extends ReducerStore<{foo: {bar: number}}> {
  constructor() {
    super({foo: {bar: 1}})
  }
  setBar() {
    this.rxState.slice("foo").updateState(draft => {
      draft.bar = 2
    })
  }
}

it("rxStore", () => {
  const store = new TestStore()
  expect(store.state.value).toEqual(1)
  store.increase()
  expect(store.state.value).toEqual(2)
})

it("rxStore nested action", () => {
  const store = new TestStore()
  store.doubleIncrease()
  expect(store.state.value).toEqual(3)
})

it("rxStore action with parameters", () => {
  const store = new TestStore()
  store.withParameters(3, 4)
  expect(store.state.value).toEqual(7)
})

it("rxStore set initial state", () => {
  const store = new TestStore().setInitialState({value: 2})
  expect(store.state.value).toEqual(2)
})

it("rxStore async action", async () => {
  expect.assertions(1)
  const store = new TestStore()
  await expect(
    store.asyncIncrease().then(() => store.state.value),
  ).resolves.toEqual(2)
})

it("rxStore slice", () => {
  const store = new TestStoreSlice()
  expect(store.state.foo.bar).toEqual(1)
  store.setBar()
  expect(store.state.foo.bar).toEqual(2)
})
