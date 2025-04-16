import { ShapeFlags } from "@vue/shared"
import { isSameVnode } from "./createVnode"

export function createRenderer(renderOptions) {

    const {
      insert: hostInsert,
      remove: hostRemove,
      createElement: hostCreateElement,
      createText: hostCreateText,
      setElementText: hostSetElementText,
      setText: hostSetText,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      patchProp: hostPatchProp
    } = renderOptions
  
    const mountChildren = (children, container) => {
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        patch(null, child, container) // 递归调用patch方法
      }
    }
  
    const mountElement = (vnode, container) => {
      const { type, children, props, shapeFlag } = vnode
      // 第一次渲染时，关联虚拟节点和真实节点 vnode.el = 真是dom
      // 后续更新时，可以和上一次的vnode作对比，之后更新对应的el元素，可以复用这个dom元素
      let el = (vnode.el = hostCreateElement(type)) // 创建真实元素
  
      if (props) {
        for (const key in props) {
          hostPatchProp(el, key, null, props[key]) // 给元素添加属性
        }
      }
      // 9 & 8 > 0 表示节点是文本节点
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, children)
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el)
      }
  
      hostInsert(el, container)
    }

    const processElement = (n1, n2, container) => {
      if (n1 == null) {
        // 初始化操作
        mountElement(n2, container)
      } else {
        // 元素更新操作
        patchElement(n1, n2, container)
      }
    }

    const patchProps = (oldProps, newProps, el) => {
        // 新的要全部生效
        for (const key in newProps) {
          hostPatchProp(el, key, oldProps[key], newProps[key])
        }

        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
    }

    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        unmount(child) // 递归调用
      }
    }

    /**
     * 比较两个数组的差异
     * 1.减少比对范围，先从头部开始，再从尾部开始
     */
    const patchKeyedChildren = (c1, c2, el) => {
      let i = 0
      // 第一个数组的尾部索引
      let e1 = c1.length - 1
      // 第二个数组的尾部索引
      let e2 = c2.length - 1

      // 任何一个数组的索引大于尾部索引，就退出循环
      while (i <= e1 && i <= e2) {
        const n1 = c1[i]
        const n2 = c2[i]
        if (isSameVnode(n1, n2)) {
          // 递归调用patch方法
          patch(n1, n2, el)
        } else {
          break
        }
        i++
      }

      // console.log(i, e1, e2)

      while (i <= e1 && i <= e2) {
        const n1 = c1[e1]
        const n2 = c2[e2]
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el)
        } else {
          break
        }
        e1--
        e2--
      }

    }

    const patchChildren = (n1, n2, el) => {
      let c1 = n1.children
      let c2 = n2.children
      let prevShapeFlag = n1.shapeFlag
      let shapeFlag = n2.shapeFlag

      // 1.新节点是文本，旧节点是数组节点 -> 移除旧的
      // 2.新节点是文本，旧节点是文本 -> 直接替换文本
      // 3.新节点是数组，旧节点是数组 -> diff算法比较两个数组
      // 4.旧节点是数组，新节点不是数组 -> 移除旧的
      // 5.旧节点是文本，新节点是空 -> 移除旧的
      // 6.旧节点是文本，新节点是数组 -> 添加新的

      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
          if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1)
          }

          if (c1 !== c2) {
            hostSetElementText(el, c2)
          }
      } else {
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { 
            // 新的是数组，旧的是数组 -> diff算法
            // patchKeyedChildren(c1, c2, el)
            // debugger
            patchKeyedChildren(c1, c2, el)
          } else {
            // 旧的是数组，新的是空
            unmountChildren(c1)
          }
        } else {
          if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 旧的是文本，新的是空
            hostSetElementText(el, '') 
          } 
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 旧的是文本，新的是数组
            mountChildren(c2, el)
          }
        }
      }

      // debugger
    }

    /**
     * 元素更新操作
     * 1.比较元素的差异
     * 2.比较元素的字节点和属性
     * @param n1 
     * @param n2 
     * @param container 
     */
    const patchElement = (n1, n2, container) => {
      let el = n2.el = n1.el

      let oldProps = n1.props || {}
      let newProps = n2.props || {}

      patchProps(oldProps, newProps, el)

      patchChildren(n1, n2, el)
    }
  
    const patch = (n1, n2, container) => {
      // 两次渲染同一个元素，直接跳过
      if (n1 == n2) return 

      // 移除旧的元素
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1)
        n1 = null
      }
  
      processElement(n1, n2, container)
    }

    const unmount = (vnode) => {
      hostRemove(vnode.el) // 删除真实dom
    }
    
    /**
     * 将虚拟节点变成真是节点进行渲染
     * @param vnode 虚拟节点
     * @param container 容器
     */
    const render = (vnode, container) => {
      if (vnode === null) {
        if (container._vnode) {
          unmount(container._vnode)
        }
      }
      patch(container._vnode || null, vnode, container)
      container._vnode = vnode // 缓存vnode，方便下次更新使用
    }
  
    return {
      render
    }
  }