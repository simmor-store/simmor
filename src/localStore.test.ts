import {createLocalStore} from "./localStore"

function createStore() {
  return createLocalStore({value: 1}, ctx => ({
    increase() {
      ctx.draft.value += 1
    },
    doubleIncrease() {
      this.increase()
      this.increase()
    },
  }))
}

it("localStore", () => {
  const {store, reducer} = createStore()
  expect(store.state.value).toEqual(1)
  reducer.increase()
  expect(store.state.value).toEqual(2)
})

it("localStore nested action", () => {
  const {store, reducer} = createStore()
  reducer.doubleIncrease()
  expect(store.state.value).toEqual(3)
})
