import patchAttr from "./modules/patchAttr";
import patchClass from "./modules/patchClass";
import patchEvent from "./modules/patchEvent";
import patchStyle from "./modules/patchStyle";

/**
 * 节点元素的属性操作
 */
export default function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    return patchClass(el, nextValue) 
  } else if (key === 'style') {
    return patchStyle(el, prevValue, nextValue) // 处理style属性
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue)
  } else {
    return patchAttr(el, key, nextValue) // 处理普通属性
  }
}