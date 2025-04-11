/**
 * 对元素形状的判断
 * 1. 元素
 * 2. 函数组件
 * 4. 状态组件
 * 8. 子节点是文本
 * 16. 子节点是数组
 * 32. 子节点是插槽
 * 64. 子节点是Teleport
 * 128. 子节点是Suspense
 * 256. 组件需要被keep-alive
 * 512. 组件已经被keep-alive
 *    1
 *   10
 *  100
 * 1000
 * 任何组合都是唯一的值
 */
export enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}