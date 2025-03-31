export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  _effect.run()
  return _effect
}

export let activeEffect

class ReactiveEffect {
  /**
   * 用于记录当前 effect 执行了几次
   */
  _tarckId = 0
  /**
   * 用来记录存放的依赖
   */
  deps = []
  _depsLength = 0
  public active = true

  /**
   * fn 是用户编写的函数
   * 如果 fn 中依赖的数据发生了变化，需要重新效用 -> run
   */
  constructor(public fn, public scheduler) {}

  run() {
    // 执行fn
    console.log('first')
    if (!this.active) {
      return this.fn()
    }

    let lastEffect = activeEffect

    try {
      activeEffect = this
      return this.fn() // 依赖收集 state.name state.age
    } finally {
      activeEffect = lastEffect
    }
  }

  stop() {
    this.active = false
  }
}

/**
 * 双向绑定
 * 将 effect 存放在 dep 中，根据值的变化触发此 dep 中存放的 effect
 * effect 的 deps 属性中存放 dep，
 */
export function tarckEffect(effect, dep) {
  dep.set(effect, effect._tarckId)
  effect.deps[effect._depsLength++] = dep
  console.log(effect.deps)
}

export function triggerEffects(deps) {
  for (const effect of deps.keys()) {
    if (effect.scheduler) {
      effect.scheduler()
    }
  }
}