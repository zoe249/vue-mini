

import { nodeOps } from './nodeOps'
import patchProp from './patchProp'

/**
 * 将节点操作盒属性操作合并
 */
const renderOptions = Object.assign({ patchProp }, nodeOps)
function createRenderer() {}

// createRenderer(renderOptions).render()
export {
  renderOptions
}
export * from '@vue/reactivity'