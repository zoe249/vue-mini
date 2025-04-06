import { isObject } from "@vue/shared"
import { ReactiveEffect } from "./effect"

type OptionsType = {
  deep: boolean
}
export function watch(source, cb, options = {} as OptionsType) {
  // debugger
  // watchEffect 也是基于 doWatch 实现的
  return doWatch(source, cb, options)
}

// 控制 depth 已经当前遍历到了哪一层
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  // console.log(...arguments)
  // debugger
  if (!isObject(source)) {
    return source
  }

  if (depth) {
    if (depth <= currentDepth) {
      return source
    }
    // 根据 deep 属性来看是否是深度
    currentDepth++
  }
  // console.log('seen', source)
  if (seen.has(source)) {
    return source
  }

  for (let key in source) {
    // console.log('key', key)
    traverse(source[key], depth, currentDepth, seen)
  }

  // 遍历就会触发每个属性的get
  return source
}

function doWatch(source, cb, { deep } = {} as OptionsType) {
  const reactiveGetter = (source) => 
    traverse(source, deep === false ? 1 : undefined)


  let getter = () => reactiveGetter(source)

  let oldValue
  const job = () => {
    const newValue = effect.run()
    cb(newValue, oldValue)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter, job)

  oldValue = effect.run()
}