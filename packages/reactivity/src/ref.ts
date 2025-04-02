import { activeEffect, tarckEffect, triggerEffects } from "./effect"
import { toReactive } from "./reactive"
import { createDep } from "./reactiveEffect"

export function ref(value) {
  return createRef(value)
}

export function createRef(value) {
  return new RefImpl(value)
}

class RefImpl {
  public __v_isRef = false // 增加ref标识
  public _value // 用来保存 ref 的值
  public dep
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newValue) {
    if (newValue !== this._value) {
      // 修改值
      this.rawValue = newValue
      this._value = newValue
      triggerRefValue(this)
    }
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    tarckEffect(activeEffect, ref.dep = createDep(() => ref.dep = undefined, 'undefined'))
  }
}

function triggerRefValue(ref) {
  let dep = ref.dep
  if (dep) {
    triggerEffects(dep)
  }
}