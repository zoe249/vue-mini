import { isObject } from "@vue/shared"
import { activeEffect } from "./effect"
import { reactive } from './reactive'
import { tarck, trigger } from "./reactiveEffect"
import { ReactiveFlags } from "./constants"



export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    // 依赖收集
    tarck(target, key)
    // 当取值的时候应该让响应式属性和 effect 映射起来
    const res = Reflect.get(target, key, recevier)
    if (isObject(res)) {
      return reactive(res)
    }
    return res
  },
  set(target, key, value, recevier) {
    // 找到属性，让对应的 effect 重新执行
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, recevier)
    if (oldValue !== value) {
      // 触发页面更新
      trigger(target, key, value, oldValue)
    }
    return result
  }
}