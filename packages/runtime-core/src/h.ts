import { isObject, isString, ShapeFlags } from "@vue/shared"
import { createVnode, isVnode } from "./createVnode"

/**
 * 1.两个参数，第二个参数可能是属性，或者虚拟节点 __v_isVnode
 * 2.第二个参数是一个数组
 * 3.其他情况就是属性
 * 4.直接传递非对象的文本
 * 5.不能出现三个参数的时候地个人只能是属性
 * 6.如果超过三个参数，后面都是子节点
 * 
 * @param type 
 * @param propsOrChildren 
 * @param children 
 * @returns 
 */
export function h(type, propsOrChildren, children) {
    let l = arguments.length
    if (l == 2) {
      // h('div', 虚拟节点|属性)
      if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
        // 虚拟节点
        if (isVnode(propsOrChildren)) {
          // h('idv', h('div', {})
          return createVnode(type, null, [propsOrChildren])
        } else {
          // 属性 h('div', {})
          return createVnode(type, propsOrChildren)
        }
      }
      // h('div', 文本|数组)
      return createVnode(type, null, propsOrChildren)
    } else {
        if (l > 3) {
          children = Array.from(arguments).slice(2)
        } 
        if (l === 3 && isVnode(children)) {
          children = [children]
        }
        return createVnode(type, propsOrChildren, children)
    }
}