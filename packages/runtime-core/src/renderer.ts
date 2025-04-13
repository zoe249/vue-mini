import { ShapeFlags } from "@vue/shared"

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
      let el = hostCreateElement(type) // 创建真实元素
  
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
  
    const patch = (n1, n2, container) => {
      // 两次渲染同一个元素，直接跳过
      if (n1 == n2) return 
  
      if (n1 == null) {
        // 初始化操作
        mountElement(n2, container)
      }
    }
    
    /**
     * 将虚拟节点变成真是节点进行渲染
     * @param vnode 虚拟节点
     * @param container 容器
     */
    const render = (vnode, container) => {
      patch(container._vnode || null, vnode, container)
      container._vnode = vnode // 缓存vnode，方便下次更新使用
    }
  
    return {
      render
    }
  }