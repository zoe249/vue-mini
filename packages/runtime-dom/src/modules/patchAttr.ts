export default function patchAttr(el, key, value) {
  if (!value) {
    el.removeAttribute(key) // 删除属性
  } else {
    el.setAttribute(key, value) // 设置属性
  }
}