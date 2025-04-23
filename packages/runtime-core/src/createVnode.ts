import { isObject, isString, ShapeFlags } from '@vue/shared'

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

export function createVnode(type, props, children?) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件
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
    shapeFlag
  }

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
    } else {
      children = String(children)
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
    }
  }

  return vnode
}
