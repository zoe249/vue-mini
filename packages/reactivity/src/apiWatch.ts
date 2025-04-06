import { isFuntion, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'
import { isRef } from './ref'

type OptionsType = {
  deep: boolean
  immediate: boolean
}
export function watch(source, cb, options = {} as OptionsType) {
  // debugger
  // watchEffect 也是基于 doWatch 实现的
  return doWatch(source, cb, options)
}

export function watchEffect(getter, options = {} as OptionsType) {
  return doWatch(getter, null, options)
}

// 控制 depth 已经当前遍历到了哪一层
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
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
  if (seen.has(source)) {
    return source
  }

  for (let key in source) {
    traverse(source[key], depth, currentDepth, seen)
  }

  // 遍历就会触发每个属性的get
  return source
}

function doWatch(source, cb, { deep, immediate } = {} as OptionsType) {
  const reactiveGetter = source =>
    traverse(source, deep === false ? 1 : undefined)
  // debugger
  let getter
  // debugger
  if (isReactive(source)) {
    getter = () => reactiveGetter(source)
  } else if (isRef(source)) {
    getter = () => source.value
  } else if (isFuntion(source)) {
    getter = source
  }

  let oldValue
  const job = () => {
    if (cb) {
      const newValue = effect.run()
      cb(newValue, oldValue)
      oldValue = newValue
    } else {
      effect.run()
    }
  }

  const effect = new ReactiveEffect(getter, job)
  if (cb) {
    // 立即执行
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()

    // watchEffect
  }
}
