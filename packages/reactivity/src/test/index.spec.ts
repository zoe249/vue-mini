import { describe, expect, it, test, beforeEach, vi } from 'vitest'
import { effect, reactive, ref } from '../index'

describe('effect', () => {
  it('最简测试：值变化时重新执行', () => {
    const state = reactive({ count: 0 })
    const spy = vi.fn() // 使用 mock 函数替代 console.log
    
    effect(() => {
      spy(state.count) // 记录每次调用的值
    })

    // 初始自动执行一次
    expect(spy).toHaveBeenCalledWith(0)

    // 修改值后应该触发第二次执行
    state.count++
    expect(spy).toHaveBeenCalledWith(1)
  })
})