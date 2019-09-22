// tslint:disable-next-line:ban-types
export function getMethodsNames(target: Function) {
  const names = Object.getOwnPropertyNames(target.prototype).filter(
    x => x !== "constructor" && typeof target.prototype[x] === "function",
  )
  return names
}

export type Constructor<T> = new (...args: any[]) => T
