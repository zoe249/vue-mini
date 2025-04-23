const queue = [] // 缓存当前要执行的任务队列
let isFlushing = false // 是否正在刷新
const resolvedPromise = Promise.resolve() // 微任务

/**
 * 
 * @param job 任务函数
 */
export function queueJob(job) {
  if (!queue.includes(job)) { // 去重
    queue.push(job) // 缓存任务
  }
  if (!isFlushing) { // 如果当前没有在刷新任务队列
    isFlushing = true // 正在刷新
    resolvedPromise.then(() => { // 微任务
      isFlushing = false
      const copy = queue.slice(0)
      queue.length = 0 // 清空任务队列
      copy.forEach(job => job()) // 执行任务队列
      copy.length = 0 // 清空任务队列
    })
  }
}