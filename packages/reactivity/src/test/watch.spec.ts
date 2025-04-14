import { describe, expect, it, test } from "vitest";
import { reactive, ref, watch, watchEffect } from '@vue/reactivity'

describe('watch', () => {
  it('watch 监听对象', () => {
    const state = reactive({ count: 0 })

    watch(() => state.state, (newValue, oldValue) => {
      expect(newValue).toBe(1)
      expect(oldValue).toBe(0)
    })

    state.count++
  })

  it('watch 监听基本数据类型', () => {
    const count = ref(0)
    watch(count, (newValue, oldValue) => {
      expect(newValue).toBe(2)
      expect(oldValue).toBe(0)
    })

    count.value+= 2
  })

  it('watch 停止监听', () => {
    const count = ref(0)
    const stop = watch(count, (newValue, oldValue) => {
      expect(newValue).toBe(2)
      expect(oldValue).toBe(0)
    })

    count.value+= 2

    setTimeout(() => {
      stop()
      count.value+= 2
      // 停止监听后，不会触发watch回调
      expect(count.value).toBe(4)
    }, 1000)
  })
})

describe('watchEffect', () => {
  it('watchEffect 监听对象', () => {
    const state = reactive({ count: 0 })
    let dummy = 0
    watchEffect(() => {
      dummy = state.count
    })

    expect(dummy).toBe(0) // 初始执行
    state.count+=2
    expect(dummy).toBe(2) // 响应更新
  })

  it('watchEffect 监听基本数据类型', () => {
    const count = ref(0)
    let dummy = 0
    watchEffect(() => {
      dummy = count.value
    })

    expect(dummy).toBe(0) // 初始执行
    count.value+=2
    expect(dummy).toBe(2) // 响应更新
  })

  it('watchEffect 停止监听', () => {
    const count = ref(0)
    let dummy = 0 

    const stop = watchEffect(() => {
      dummy = count.value
    })

    stop() // 停止监听
    count.value+=2 // 不会触发watchEffect回调
    expect(dummy).toBe(0) // dummy 保持为 0，没有更新
  })
})