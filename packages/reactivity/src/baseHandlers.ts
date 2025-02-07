import { activeEffect } from "./effect"
import { tarck, trigger } from "./reactiveEffect"

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    // 依赖收集
    tarck(target, key)
    // 当取值的时候应该让响应式属性和 effect 映射起来
    return Reflect.get(target, key, recevier)
  },
  set(target, key, value, recevier) {
    // 找到属性，让对应的 effect 重新执行
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, recevier)
    console.log(oldValue, value)
    if (oldValue !== value) {
      // debugger
      trigger(target, key, value, oldValue)
    }
    return result
  }
}