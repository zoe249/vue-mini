import { ShapeFlags } from "@vue/shared";
import { onMounted, onUpdated } from "../apiLifecycle";
import { getCurrentInstance } from "../component";

export const KeepAlive = {
  __isKeepAlive: true,
  props: {
    max: Number, // 缓存组件的最大数量，LR
  },
  setup(props, { slots }) {
    const { max } = props;
    const keys = new Set(); // 用来记录哪些组件缓存过
    const cache = new Map(); // 缓存表 <keep-alive key="">
    // 在组件内需要一些dom方法，将元素移动到dom中
    // 还可以卸载某个元素
    let pendingCacheKey = null;
    const instance = getCurrentInstance();

    const cacheSubtree = () => {
      cache.set(pendingCacheKey, instance.subTree); // 缓存组件的虚拟节点
    };

    const { move, createElement, unmount: _unmount } = instance.ctx.renderer
    function reset(vnode) {
      let shapeFlag = vnode.shapeFlag;
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
      }
      if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      }

      vnode.shapeFlag = shapeFlag;
    }
    function unmount(vnode) {
      reset(vnode); // 将vnode上的标识还原
      _unmount(vnode); // 执行真正的删除
    }
    function purneCacheEntry(key) {
      keys.delete(key)
      const cached = cache.get(key)

      // 还原vnode上的标识，否则无法消除
      unmount(cached)
    }

    instance.ctx.activate = function (vnode, container, anchor) {
      // 将元素直接移动到container中
      move(vnode, container, anchor)
    }
    const storageContent = createElement('div')
    instance.ctx.deactivated = function (vnode) {
      move(vnode, storageContent, null)
    }

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
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.COMPONENT_KEPT_ALIVE;
        keys.delete(key); // 缓存命中，删除keys
        keys.add(key); // 缓存命中，添加keys
      } else {
        keys.add(key);
        console.log(max, keys.size)
        if (max && keys.size > max) {
          // 缓存的组件数量超过了最大数量，删除最久没有使用的组件

          // set中的第一个元素就是最久没有使用的组件
          purneCacheEntry(keys.values().next().value); 
        }
      }
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE // 标识组件需要被缓存，不需要被卸载
      return vnode;
    };
  },
};

export const isKeepAlive = (vnode) => {
  return vnode.type.__isKeepAlive;
};
