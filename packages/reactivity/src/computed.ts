import { isFunction } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

class ComputedRefImpl {
  public _value
  public effect
  constructor(getter, public setter) {
    // 创建一个 effect ，来关联当前计算属性的dirty
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 计算属性的依赖发生了变化，重新执行 effect
        triggerRefValue(this)
        // 依赖的属性发生变化后需要触发重新渲染，还需要将 dirty 变为 true
      }
    )
  }
  get value() {
    // 优化处理：增加缓存
    if (this.effect.dirty) {
      this._value = this.effect.run()
      trackRefValue(this)
      // 当前在 effect 中访问了计算属性，计算属性是可以收集这个 effect 的
    }
    return this._value
  }
  set value(v) {
    // ref 的 setter
    this.setter(v)
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions)

  let getter
  let setter 
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
