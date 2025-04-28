import { proxyRefs, reactive } from '@vue/reactivity'
import { hasOwn, isFunction, ShapeFlags } from '@vue/shared'

export function createComponentInstance(vnode) {
  const instance = {
    data: null, // 状态
    vnode: vnode, // 虚拟节点
    /**
     * 子节点
     */
    subTree: null,
    /**
     * 是否是第一次渲染
     */
    isMounted: false,
    /**
     * 更新函数
     */
    update: null,
    props: {},
    attrs: {},
    /**
     * 插槽
     */
    slots: {}, 
    /**
     * 组件的props选项
     */
    propsOptions: vnode.type.props,
    /**
     * 组件实例
     */
    component: null,
    /**
     * 用来代理 props attrs data 等
     */
    proxy: null,

    setupState: {}
  }

  return instance
}

// 初始化组件
const initProps = (instance, rawProps) => {
  const props = {}
  const attrs = {}

  // 组件的propsOptions
  const propsOptions = instance.propsOptions || {}

  // debugger
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      if (key in propsOptions) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }
  // 不需要深度监听，因为组件的props是不可变的
  instance.props = reactive(props)
  instance.attrs = attrs
}

const publicProperty = {
  $attrs: instance => instance.attrs,
  $slots: instance => instance.slots
  //...
}

const handler = {
  get(target, key) {
    const { data, props, setupState } = target

    // props.name -> state.name
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key]
    }
    const getter = publicProperty[key]
    if (getter) {
      return getter(target)
    }
    // 对于无法修改的属性，$attrs $slots $emit 等 $slots -> instance.slots
  },
  set(target, key, value) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      // props[key] = value
      console.warn(`props is readonly`)
      return false
    } else if (target.setupState && hasOwn(target.setupState, key)) {
      target.setupState[key] = value
    }
    return true
  }
}

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) { // 有slots
    instance.slots = children
  } else { // 没有slots
    instance.slots = {}
  }
}

export function setupComponent(instance) {
  const { vnode } = instance
  /**
   * 赋值属性
   */
  initProps(instance, vnode.props || {})
  initSlots(instance, vnode.children)
  console.log(instance.slots)
  // debugger
  /**
   * 赋值代理对象
   */
  instance.proxy = new Proxy(instance, handler)

  const { data, render, setup } = vnode.type 

  if (setup) {
    const setupContext = {}
    const setupResult = setup(instance.props, setupContext)
    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else {
      // 自动脱ref
      instance.setupState = proxyRefs(setupResult)
    }
  }

  if (data) {
    !isFunction(data) && console.warn('data option must be a function')
    instance.data = isFunction(data) && reactive(data.call(instance.proxy))
  }
  
  if (!instance.render) {
    instance.render = render
  }
}
