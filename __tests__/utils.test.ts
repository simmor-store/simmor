import {getMethodsNames} from "../src/utils/utils"

class FooBar {
  public static staticFoo() {}
  public fooVar = 123
  constructor() {}
  public foo() {}
  public bar() {}
}

it("rxRootState", () => {
  const methodsNames = getMethodsNames(FooBar)
  expect(methodsNames).toEqual(["foo", "bar"])
})
