import { currentInstance, setCurrentInstance, unsetCurrentInstance } from './component'

export const enum LifeCycle {
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u',
}

function createHook(type) {
    // 将当前的实例存到了钩子上
    return (hook, target = currentInstance) => {
        // console.log(type, hook)
        if (target) {
            // 当前钩子是在组件中运行的
            const hooks = (target[type] || (target[type] = []))

            const wrapHook = () => {
                // 在钩子执行前，将当前实例设置为target
                setCurrentInstance(target)
                hook.call(target)
                unsetCurrentInstance()
            }

            // setup执行完毕后，会将currentInstance赋值为null
            hooks.push(wrapHook)
        }
    }
}

export const onBeforeMount = createHook(LifeCycle.BEFORE_MOUNT)
export const onMounted = createHook(LifeCycle.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycle.BEFORE_UPDATE)
export const onUpdated = createHook(LifeCycle.UPDATED)

export function invokeArray(fns) {
    for (let i = 0; i < fns.length; i++) {
        fns[i]()
    }
}