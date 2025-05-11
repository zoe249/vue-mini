import { ShapeFlags } from "@vue/shared";
import { onMounted, onUpdated } from "../apiLifecycle";
import { getCurrentInstance } from "../component";

export const KeepAlive = {
  __isKeepAlive: true,
  setup(props, { slots }) {
    const keys = new Set(); // 用来记录哪些组件缓存过
    const cache = new Map(); // 缓存表 <keep-alive key="">
    // 在组件内需要一些dom方法，将元素移动到dom中
    // 还可以卸载某个元素
    let pendingCacheKey = null;
    const instance = getCurrentInstance();

    const cacheSubtree = () => {
      cache.set(pendingCacheKey, instance.subTree); // 缓存组件的虚拟节点
      console.log(cache);
    };
    onMounted(cacheSubtree);
    onUpdated(cacheSubtree);
    return () => {
      const vnode = slots.default();
      const comp = vnode.type;
      const key = vnode.key == null ? comp : vnode.key;
      const cacheVNode = cache.get(key);
      pendingCacheKey = key;
      if (cacheVNode) {
        // 复用组件的虚拟节点
        vnode.component = cacheVNode.component;
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      } else {
        keys.add(key);
        //   cache.set(key, vnode)
      }
      return vnode;
    };
  },
};

export const isKeepAlive = (vnode) => {
  return vnode.type.__isKeepAlive;
};
