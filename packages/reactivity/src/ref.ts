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

export function trackRefValue(ref) {
  if (activeEffect) {
    tarckEffect(
      activeEffect, 
      ref.dep = createDep(() => ref.dep = undefined, 'undefined')
    )
  }
}

export function triggerRefValue(ref) {
  let dep = ref.dep
  if (dep) {
    triggerEffects(dep)
  }
}

class ObjectRefImp {
  public __v_isRef = false // 增加ref标识
  constructor(public _object, public _key) {

  }

  get value() {
    return this._object[this._key]
  }
  set value(newValue) {
    this._object[this._key] = newValue
  }
}

export function toRef(object, key) {
  return new ObjectRefImp(object, key)
}

export function toRefs(object) {
  const res = {}
  Object.keys(object).forEach(key => {
    res[key] = toRef(object, key)
  })
  return res
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, recevier) {
      let r = Reflect.get(target, key, recevier)
      return r.__v_isRef ? r.value : r
    },
    set(target, key, value, recevier) {
      const oldValue = target[key]
      if (oldValue.__v_isRef) {
        oldValue.value = value
        return true
      } else {
        return Reflect.set(target, key, value, recevier)
      }
    }
  })
}