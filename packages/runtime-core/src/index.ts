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

  const patch = (n1, n2, container) => {

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