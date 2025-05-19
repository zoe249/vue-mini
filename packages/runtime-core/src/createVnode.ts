import { isFunction, isObject, isString, ShapeFlags } from '@vue/shared'
import { isTeleport } from './components/Teleport'

export const Text = Symbol('Text')

export const Fragment = Symbol('Fragment')

/**
 * 判断是否是虚拟节点
 * @param value 虚拟节点
 * @returns 是虚拟节点返回true，不是返回false
 */
export function isVnode(value) {
  return value.__v_isVnode
}

/**
 * 对比两个虚拟节点是否相同
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 * @returns 相同返回true，不同返回false
 */
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

export function createVnode(type, props, children?, patchFlag?) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isTeleport(type)
    ? ShapeFlags.TELEPORT // teleport组件
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT // 组件
    : 0
  const vnode = {
    /**
     * 表示是一个虚拟节点
     */
    __v_isVnode: true,
    type,
    props,
    children,
    /**
     * diff算法需要的key
     */
    key: props?.key,
    /**
     * 虚拟节点对应的真实节点
     */
    el: null,
    shapeFlag,
    ref: props?.ref,
    patchFlag
  }

  if (currentBlock && patchFlag > 0) {
    currentBlock.push(vnode)
  }

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      // 组件的slots
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.SLOTS_CHILDREN
    } else {
      children = String(children)
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
    }
  }

  return vnode
}

let currentBlock = null
export function openBlock() {
  currentBlock = [] // 收集动态节点
}

export function closeBlock() {
  currentBlock = null
}

export function setupBlock(vnode) {
  vnode.dynamicChildren = currentBlock // 当前elementBlock会收集子节点，用当前的block来收集
  closeBlock()
  return vnode
}
/**
 * block 有收集虚拟节点的能力
 */
export function createELementBlock(type, props, children, patchFlag?) {
  return setupBlock(createVnode(type, props, children, patchFlag))
}

export function toDisplayString(value) {
  return isString(value)
    ? value
    : value == null
    ? ''
    : isObject(value)
    ? JSON.stringify(value)
    : String(value)
}

// export { createVnode as createElementVnode }
