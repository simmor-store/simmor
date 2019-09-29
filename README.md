Simmor is a simple immutable boilerplate-free store with support of middlewares and state slicing.


# Install
`npm install simmor`

# Examples

Simmor is framework agnostic, but examples use [react-simmor](https://github.com/simmor-store/react-simmor) package

# Online demo

[https://codesandbox.io/s/github/simmor-store/react-simmor/tree/master/examples](https://codesandbox.io/s/github/simmor-store/react-simmor/tree/master/examples)


# Local store
The simplest way to use simmor is by creating a localStore.

```ts
  const [state, dispatch] = useLocalStore({value: 0}, ctx => ({
    increase() {
      ctx.draft.value += 1
    },
    decrease() {
      const newValue = ctx.draft.value - 1
      if (newValue >= 0) {
        ctx.draft.value = newValue
      }
    },
    increaseWithDelay() {
      setTimeout(() => this.increase(), 300)
    },   
    setValue(value: number) {
      ctx.draft.value = value
    }
  }))

```
```ts
    <div className="counter">
      <span>{state.value}</span>
      <button onClick={() => dispatch.increase()}>+</button>
      <button onClick={() => dispatch.decrease()}>-</button>
      <button onClick={() => dispatch.setValue(0)}>reset</button>
      <button onClick={() => dispatch.increaseWithDelay()}>Increase with delay</button>
    </div>

```

# Store class
It's possible to create store as class

```ts
export type CounterState = { value: number }

export class CounterStore extends ReducerStore<CounterState> {

  increase() {
    this.draft.value += 1
  }

  decrease() {
    const newValue = this.draft.value - 1
    if (newValue >= 0) {
      this.draft.value = newValue
    }
  }

  setValue(value: number) {
    this.draft.value = value
  }
}

```

```ts
export const Counter = ({store}: { store: CounterStore }) => {
  const value = useStore(store, x => x.value)
  return (
    <div className="counter"><span>{value}</span>
      <button onClick={() => store.increase()}>+</button>
      <button onClick={() => store.decrease()}>-</button>
      <button onClick={() => store.setValue(0)}>Reset</button>
    </div>
  )
}

```
```ts
const store = new CounterStore({value: 0})
<Counter store={store}/>
```

# Middleware
An example of middleware that saves state to localStorage.
```ts
export function createLocalStorageMiddleware(name: string): Middleware {
  return next => action => {
    const result = next(action)
    if (action.methodName === "constructor") {
      const savedState = localStorage.getItem(name)
      if (savedState) {
        action.context.rxState.setState(JSON.parse(savedState))
      }
    }
    localStorage.setItem(name, JSON.stringify(action.context.rxState.state))
    return result
  }
}
```

```ts
const persistentStore = new CounterStore({value: 0}, {
    middlewares: [createLocalStorageMiddleware('counter')]
})

<Counter store={persistentStore}/>
```

# State slicing
It is possible to slice a part of the state.
For example if we need two counters and we want to swap values between them.

```ts

type CounterPairState = {
  left: CounterState
  right: CounterState
}

export class CounterPairStore extends ReducerStore<CounterPairState> {
  leftStore = new CounterStore(this.rxState.slice('left'))
  rightStore = new CounterStore(this.rxState.slice('right'))

  constructor() {
    super({left: {value: 100}, right: {value: 200}})
  }

  swap() {
    const [leftValue, rightValue] = [this.state.left.value, this.state.right.value]
    this.leftStore.setValue(rightValue)
    this.rightStore.setValue(leftValue)
  }

  static sum(state: CounterPairState) {
    return state.left.value + state.right.value
  }
}

```
```ts
const store = new CounterPairStore()
export const CounterPair = () => {
  const state = useStore(store, x => x)
  const sum = CounterPairStore.sum(state)

  return (
    <div className="pair">
      <div>
        <button onClick={() => store.swap()}>swap</button>
        <span>Sum {sum}</span>
      </div>
      <Counter store={store.leftStore}/>
      <Counter store={store.rightStore}/>
    </div>
  )

}
```





