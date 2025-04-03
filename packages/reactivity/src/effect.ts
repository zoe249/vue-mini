import { DirtyLevels } from "./constants"

export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  _effect.run()

  if (options) {
    Object.assign(_effect, options)
  }

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect // 可以在 run 方法上获取到 effect 的引用
  return runner
}

export let activeEffect

function preCleanEffect(effect) {
  if (effect) {
    effect._depsLength = 0
    effect._tarckId++ // 每次执行effct，_tarckId +1, 如果同一个effect执行，id就是相同的
  }
}

function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect)
    }

    effect.deps.length = effect._depsLength
  }
}

export class ReactiveEffect {
  /**
   * 用于记录当前 effect 执行了几次
   */
  _tarckId = 0
  /**
   * 用来记录存放的依赖
   */
  deps = []
  _depsLength = 0
  _running = 0
  _dirtyLevel = DirtyLevels.Dirty
  public active = true

  /**
   * fn 是用户编写的函数
   * 如果 fn 中依赖的数据发生了变化，需要重新效用 -> run
   */
  constructor(public fn, public scheduler) {}

  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty
  }
  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty
  }

  run() {
    // 执行fn
    this._dirtyLevel = DirtyLevels.NoDirty
    if (!this.active) {
      return this.fn()
    }

    let lastEffect = activeEffect

    try {
      activeEffect = this
      // effect 重新执行前，需要将上一次的依赖清空 effect.deps
      preCleanEffect(this)
      this._running++
      return this.fn() // 依赖收集 state.name state.age
    } finally {
      this._running--
      postCleanEffect(this)
      activeEffect = lastEffect
    }
  }

  stop() {
    this.active = false
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect)
  if (dep.size == 0) {
    dep.cleanup() // 如果 map 为空，则删除这个属性
  }
}

/**
 * 依赖收集 双向绑定
 * 将 effect 存放在 dep 中，根据值的变化触发此 dep 中存放的 effect
 * effect 的 deps 属性中存放 dep
 *
 * 1._trackId 用于记录执行次数（防止在一个属性在当前effect中多次依赖收集）只收集一次
 * 2.拿到上一次依赖的最后一个和这次比较
 */
export function tarckEffect(effect, dep) {
  // 需要重新收集依赖，将不需要的移除
  // dep.set(effect, effect._tarckId)
  // effect.deps[effect._depsLength++] = dep
  if (dep.get(effect) !== effect._tarckId) {
    dep.set(effect, effect._tarckId)

    let oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) {
        // 清除旧值
        cleanDepEffect(oldDep, effect)
      }
      effect.deps[effect._depsLength++] = dep
    } else {
      effect._depsLength++
    }
  }
}

export function triggerEffects(deps) {
  for (const effect of deps.keys()) {
    if (!effect._running) {
      if (effect.scheduler) {
        // 如果当前effect不在执行中
        effect.scheduler()
      }
    }
  }
}
