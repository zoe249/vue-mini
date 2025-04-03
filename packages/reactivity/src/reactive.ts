import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";
import { ReactiveFlags } from "./constants";


// 用户记录代理后的响应式对象，可以复用
const reactiveMap = new WeakMap()

function createReactiveObject(target) {
  // 响应式数据必须是对象
  if (!isObject(target)) {
    return target
  }

  // 触发事件劫持
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // 拿到缓存，如果存在直接返回
  const exitsProxy = reactiveMap.get(target)
  if (exitsProxy) {
    return exitsProxy
  }

  let proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}

export function reactive(target) {
  return createReactiveObject(target)
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}