Simmor is a simple immutable boilerplate-free framework-agnostic store with support of middlewares and state slicing.


# Install
`npm install simmor`

# Examples

* [React](https://github.com/simmor-store/react-simmor) 
* [Angular](https://github.com/simmor-store/angular-simmor-examples)

# Online demo

[https://codesandbox.io/s/github/simmor-store/react-simmor/tree/master/examples](https://codesandbox.io/s/github/simmor-store/react-simmor/tree/master/examples)

# React examples

The simplest way to use simmor is by creating a localStore. 

Here an example of counter store that has state `{value: number}`.

State can be modified throw `draft` field. Simmor uses [immer](https://github.com/immerjs/immer) that can update immutable state by mutating it.

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
We can define store as class.

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
Simmor supports middlewares. Here an example of middleware that saves state to localStorage.
```ts
export function createLocalStorageMiddleware(key: string): Middleware {
  return next => action => {
    const newState = next(action)
    if (action.methodName === "constructor") {
      const savedState = localStorage.getItem(key)
      if (savedState) {
        return JSON.parse(savedState)
      }
    }
    localStorage.setItem(key, JSON.stringify(newState))
    return newState
  }
}

```
We can pass middlewares in the constructor of the store and our component can now save its state between sessions.


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
  leftStore = new CounterStore(this.slice('left'))
  rightStore = new CounterStore(this.slice('right'))

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
And the component
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





