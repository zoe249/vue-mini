import { currentInstance } from "./component";

export function provide(key, value) {
    /**
     * 子组件用的是父亲的provides
     */
    if (!currentInstance) return
    // 获取父组件的provides
    const parentProvides = currentInstance.parent?.provides

    // 当前组件的provides
    let provides = currentInstance.provides

    if (parentProvides === provides) {
        // 如果在子组件新增了provides，需要拷贝一份全新的
        provides = currentInstance.provide = Object.create(provides)
    }
    provides[key] = value
}

export function inject(key, defaultValue = null) {
     if (!currentInstance) return
    //  debugger
     const provides = currentInstance.parent?.provides
     if (provides && key in provides) {
         return provides[key]
     } else {
         return defaultValue
     } 
}