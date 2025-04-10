export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style

  // 写入样式
  for (let key in nextValue) {
    style[key] = nextValue[key]
  }

  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] == null) { // 移除样式
        style[key] = null
      } 
    }
  }
}