export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function isFuntion(value) {
  return typeof value === 'function'
}

export * from './shapelags'