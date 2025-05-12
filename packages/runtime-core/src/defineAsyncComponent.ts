import { ref } from '@vue/reactivity'
import { h } from './h'
import { isFunction } from '@vue/shared'

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options = { loader: options }
  }
  const { loader, errorComponent, timeout, delay, loadingComponent, onError } = options
  return {
    setup() {
      const loaded = ref(false)
      const loading = ref(false)
      const error = ref(false)

      let loadingTimer = null
      if (delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true
        }, delay)
      }

      let Comp = null

      let attempts = 0
      function loadFunc() {
        attempts++
        return loader().catch(err => {
          if (onError) {
            return new Promise((resolve, reject) => {
              const retry = () => {
                resolve(loadFunc())
              }
              const fail = () => {
                reject(err)
              }
              onError(err, retry, fail, ++attempts)
            })
          } else { 
            throw err
          }
        })
      }
      loader().then(loadFunc())
      loadFunc()
        .then(comp => {
          Comp = comp
          loaded.value = true
        })
        .catch(err => {
          error.value = true
        }).finally(() => {
          loading.value = false
          clearTimeout(loadingTimer)
        })

      if(timeout) {
        setTimeout(() => {
          error.value = true
          throw new Error('timeout')
        }, timeout)
      }
      // @ts-ignore
      const placeholder = h('div')
      return () => {
        if (loaded.value) {
          // @ts-ignore
          return h(Comp)
        } else if (error.value && errorComponent) {
          // @ts-ignore
          return h(errorComponent)
        } else if (loading.value && loadingComponent) {
          // @ts-ignore
          return h(loadingComponent) 
        } else {
          return placeholder
        }
        // return loaded.value ? h(Comp) : h('div', 'loading...')
      }
    }
  }
}
