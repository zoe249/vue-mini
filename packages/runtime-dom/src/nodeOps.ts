/**
 * 对节点元素的增删改查
 */
export const nodeOps = {
  insert: (el, parent, anchor = null) => parent.insertBefore(el, anchor),
  remove(el) {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },
  createElement: (type) => document.createElement(type),
  createText: (text) => document.createTextNode(text),
  setElementText: (el, text) => el.textContent = text,
  setText: (node, text) => node.nodeValue = text,
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
}