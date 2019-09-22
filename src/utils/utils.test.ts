import {getMethodsNames} from "./utils"

class FooBar {
  static staticFoo() {}
  fooVar = 123
  constructor() {}
  foo() {}
  bar() {}
}

it("rxRootState", () => {
  const methodsNames = getMethodsNames(FooBar)
  expect(methodsNames).toEqual(["foo", "bar"])
})
