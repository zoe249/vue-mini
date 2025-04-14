import { describe, expect, it, test } from 'vitest'
import { effect, reactive } from '../index'

describe('effect', () => {
  it('应该自动追踪依赖并执行', () => {
    const obj = reactive({ count: 0 })
    let dummy
    effect(() => {
      dummy = obj.count
    })

    expect(dummy).toBe(0) // 初始执行

    obj.count++
    expect(dummy).toBe(1) // 响应更新
  })
})
