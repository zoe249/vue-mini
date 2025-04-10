function createInvoker(value) {
  const invoker = (e) => invoker.value(e)
  // 更改 invoker 的 value 属性就可以修改对应的调用函数
  invoker.value = value
  return invoker
}

export default function patchEvent(el: HTMLElement & { _vei: any }, name: string, nextValue: (event: Event) => void) {
  // _vei 等价于 vue_event_invoker
  const invokers = el._vei || (el._vei = {})
  const eventName = name.slice(2).toLowerCase()

  // 是否存在同名的绑定事件
  const existingInvoker = invokers[name]

  if (nextValue && existingInvoker) {
    // 事件换绑
    return existingInvoker.value = nextValue
  }

  if (nextValue) {
    const invoker = (invokers[name] = createInvoker(nextValue))
    return el.addEventListener(eventName, invoker)
  }

  if (existingInvoker) {
    el.removeEventListener(eventName, existingInvoker)
    invokers[name] = undefined
  }
}
