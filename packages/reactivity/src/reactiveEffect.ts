import { activeEffect, tarckEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap()

export function createDep(cleanup, key) {
  const dep = new Map() as any
  dep.cleanup = cleanup // 清理方法
  dep.name = key // 自定义标识，标识这映射表是发给哪个属性的
  return dep
}

interface Dep {
  cleanup: () => void;
  name: string;
}

type TargetMap = WeakMap<object, Map<string | symbol, Dep>>;

export function tarck(target: object, key: string | symbol): void {
  if (activeEffect) {
    let depsMap: Map<string | symbol, Dep> | undefined = targetMap.get(target);

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map<string | symbol, Dep>()));
    }

    let dep: Dep | undefined = depsMap.get(key);

    if (!dep) {
      depsMap.set(
        key,
        (dep = createDep(() => depsMap!.delete(key), key))
      );
    }
    // 将当前的 effect 放入到 dep 映射表中，后续可以根据值的变化触发此dep中存放的effect
    tarckEffect(activeEffect, dep);
  }
}

export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)

  // 不存在对象，直接返回
  if (!depsMap) {
    return
  }

  let dep = depsMap.get(key)
  if (dep) {
    // 修改了属性
    triggerEffects(dep)
  }
}