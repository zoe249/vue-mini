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
  deps = []
  _depsLength = 0
  public active = true

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
      return this.fn()
    } finally {
      activeEffect = lastEffect
    }
  }
}

export function tarckEffect(effect, dep) {
  dep.set(effect, effect._tarckId)
  effect.deps[effect._depsLength++] = dep
}

export function triggerEffects(deps) {
  for (const effect of deps.keys()) {
    if (effect.scheduler) {
      effect.scheduler()
    }
  }
}