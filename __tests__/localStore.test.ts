import {createLocalStore} from "../src/localStore"

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
  const {rxState, dispatch} = createStore()
  expect(rxState.state.value).toEqual(1)
  dispatch.increase()
  expect(rxState.state.value).toEqual(2)
})

it("localStore nested action", () => {
  const {rxState, dispatch} = createStore()
  dispatch.doubleIncrease()
  expect(rxState.state.value).toEqual(3)
})
