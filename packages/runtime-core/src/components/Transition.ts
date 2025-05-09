import { h } from '../h'

function nextFrame(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn)
  })
}

export function resolveTransitionProps(props) {
  const {
    name = 'v',
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    onBeforeEnter,
    onEnter,
    onLeave
  } = props
  
  return {
    onBeforeEnter(el) {
      onBeforeEnter && onBeforeEnter(el)
      el.classList.add(enterFromClass)
      el.classList.add(enterActiveClass)
    },
    onEnter(el, done) {
      const resolve = () => {
        el.classList.remove(enterToClass)
        el.classList.remove(enterActiveClass)
        done && done()
      }
      onEnter && onEnter(el, resolve)

      // 在下一帧执行
      nextFrame(() => { // 保证动画的执行
        el.classList.remove(enterFromClass)
        el.classList.add(enterToClass)
        if (!onEnter || !onEnter.length) {
          el.addEventListener('transitionend', resolve)
        }
      })
    },
    onLeave(el, done) {
      // debugger
      const resolve = () => {
        el.classList.remove(leaveActiveClass)
        el.classList.remove(leaveToClass)
        done && done()
      }
      onLeave && onLeave(el, resolve)
      el.classList.add(leaveFromClass) // 离开动画不能立即执行
      document.body.offsetHeight // 强制重绘
      el.classList.add(leaveActiveClass)

      nextFrame(() => {
        el.classList.remove(leaveFromClass)
        el.classList.add(leaveToClass)

        if (!onLeave || onLeave.length <= 1) {
          el.addEventListener('transitionend', resolve)
        }
      })
    }
  }
}

export function Transition(props, { slots }) {
  // console.log(props, slots)

  // 函数式组件的功能比较少，为了方便，函数式组件处理了属性
  // 处理属性后传递给状态组件 setup
  return h(BaseTransitionImpl, resolveTransitionProps(props), slots)
}

const BaseTransitionImpl = {
  // 只调用封装后的钩子即可
  props: {
    onBeforeEnter: Function,
    onEnter: Function,
    onLeave: Function
  },
  setup(props, {slots}) {
    return () => {
      const vnode = slots.default && slots.default()
      // const instance = getCurrentInstance()
      if (!vnode) {
        return null
      }
      // 渲染前
      // 渲染后
      // 旧的虚拟节点
      // const oldVnode = instance.subTree
  
      vnode.transition = {
        beforeEnter: props.onBeforeEnter,
        enter: props.onEnter,
        leave: props.onLeave
      }
      return vnode
    }
  }
}
