import "./rxState"
import {RxRootState} from "./rxState"

const initialState = {
  value: 1,
  foo: {bar: 2},
}

it("rxRootState", () => {
  const rxState = new RxRootState(initialState)
  rxState.updateState(draft => {
    draft.foo.bar = 4
  })
  expect(rxState.state.foo.bar).toEqual(4)
})

it("rxRootState reset", () => {
  const rxState = new RxRootState(initialState)
  rxState.updateState(draft => {
    draft.value = 2
    draft.foo.bar = 4
  })
  rxState.reset()
  expect(rxState.state).toEqual(initialState)
})

it("rxSliceState", () => {
  const root = new RxRootState(initialState)
  const rxState = root.slice("foo")
  rxState.updateState(draft => {
    draft.bar = 4
  })
  expect(rxState.state.bar).toEqual(4)
  expect(root.state.foo.bar).toEqual(4)
})

it("rxSliceState reset", () => {
  const root = new RxRootState(initialState)
  const sliceState = root.slice("foo")
  root.updateState(draft => {
    draft.value = 3
  })
  sliceState.updateState(draft => {
    draft.bar = 4
  })
  sliceState.reset()
  expect(root.state.value).toEqual(3)
  expect(sliceState.state.bar).toEqual(2)
  expect(root.state.foo.bar).toEqual(2)
})
