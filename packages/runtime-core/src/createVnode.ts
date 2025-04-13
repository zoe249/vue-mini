import { isObject, isString, ShapeFlags } from "@vue/shared"

export function isVnode(value) {
    return value.__v_isVnode
  }
  
  export function createVnode(type, props, children?) {
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0
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