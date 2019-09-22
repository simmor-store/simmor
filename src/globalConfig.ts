import {Middleware} from "./middleware"

interface Config {
  middlewares: Middleware[]
}

export let globalConfig: Config = {
  middlewares: [],
}

export function setGlobalConfig(c: Config) {
  globalConfig = c
}
