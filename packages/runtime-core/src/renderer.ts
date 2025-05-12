import { hasOwn, ShapeFlags } from "@vue/shared";
import { createVnode, Fragment, isSameVnode, Text } from "./createVnode";
import getSequence from "./seq";
import { isRef, reactive, ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";
import { createComponentInstance, setupComponent } from "./component";
import { invokeArray } from "./apiLifecycle";
import { isKeepAlive } from "./components/KeepAlive";

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const normalize = (children) => {
    for (let i = 0; i < children.length; i++) {
      // let child = children[i]
      if (typeof children[i] === "string" || typeof children[i] === "number") {
        children[i] = createVnode(Text, null, String(children[i]));
      }
    }
  };

  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      normalize(children);
      patch(null, children[i], container, parentComponent); // 递归调用patch方法
    }
  };

  const mountElement = (vnode, container, anchor, parentComponent) => {
    const { type, children, props, shapeFlag, transition } = vnode;
    // 第一次渲染时，关联虚拟节点和真实节点 vnode.el = 真是dom
    // 后续更新时，可以和上一次的vnode作对比，之后更新对应的el元素，可以复用这个dom元素
    let el = (vnode.el = hostCreateElement(type)); // 创建真实元素

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]); // 给元素添加属性
      }
    }
    // 9 & 8 > 0 表示节点是文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }
    if (transition) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);

    if (transition) {
      transition.enter(el);
    }
  };

  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      // 初始化操作
      mountElement(n2, container, anchor, parentComponent);
    } else {
      // 元素更新操作
      patchElement(n1, n2, container, parentComponent);
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    // 新的要全部生效
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const unmountChildren = (children, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child, parentComponent); // 递归调用
    }
  };

  /**
   * 比较两个数组的差异
   * 1.减少比对范围，先从头部开始，再从尾部开始
   */
  const patchKeyedChildren = (c1, c2, el, parentComponent) => {
    let i = 0;
    // 第一个数组的尾部索引
    let e1 = c1.length - 1;
    // 第二个数组的尾部索引
    let e2 = c2.length - 1;

    // 任何一个数组的索引大于尾部索引，就退出循环
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        // 递归调用patch方法
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 确认不变化的节点，对插入和移除做了处理
    if (i > e1) {
      if (i <= e2) {
        let nextPos = e2 + 1;
        let anchor = c2[nextPos]?.el; // 下一个元素的真实dom
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i], parentComponent);
          i++;
        }
      }
    } else {
      // 乱序的情况
      let s1 = i;
      let s2 = i;
      // 插入的个数
      let toBePatched = e2 - s2 + 1;

      let newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      // [4, 2, 3, 0] -> [1, 2] 最长递增子序列对应的索引
      // 创建一个映射表，用于快速查找数组中元素的索引
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        // 通过key查找数组中新元素的索引
        const newIndex = keyToNewIndexMap.get(vnode.key);
        if (newIndex == undefined) {
          // 旧的元素在新的元素中不存在，直接移除
          unmount(vnode, parentComponent);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 比较前后节点的差异，更新子节点和属性
          patch(vnode, c2[newIndex], el, null);
        }
      }

      let incresingSeq = getSequence(newIndexToOldIndexMap);
      // 索引
      let j = incresingSeq.length - 1;
      // console.log(newIndexToOldIndexMap)
      // 调整元素的位置
      // 调整过程中，可能新的元素比旧的元素多，需要创建新的元素
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 对应的索引
        let newIndex = s2 + i;
        let anchor = c2[newIndex + 1]?.el;
        // console.log(anchor, keyToNewIndexMap, newIndex)
        let vnode = c2[newIndex];
        if (!vnode.el) {
          // 新列表中新增的元素
          patch(null, vnode, el, anchor); // 插入到anchor前面的位置
        } else {
          if (i == incresingSeq[j]) {
            j--;
          } else {
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }
  };

  const patchChildren = (n1, n2, el, parentComponent) => {
    let c1 = n1.children;
    let c2 = n2.children;
    normalize(n2.children);
    let prevShapeFlag = n1.shapeFlag;
    let shapeFlag = n2.shapeFlag;

    // 1.新节点是文本，旧节点是数组节点 -> 移除旧的
    // 2.新节点是文本，旧节点是文本 -> 直接替换文本
    // 3.新节点是数组，旧节点是数组 -> diff算法比较两个数组
    // 4.旧节点是数组，新节点不是数组 -> 移除旧的
    // 5.旧节点是文本，新节点是空 -> 移除旧的
    // 6.旧节点是文本，新节点是数组 -> 添加新的

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1, parentComponent);
      }

      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的是数组，旧的是数组 -> diff算法
          // patchKeyedChildren(c1, c2, el)
          // debugger
          patchKeyedChildren(c1, c2, el, parentComponent);
        } else {
          // 旧的是数组，新的是空
          unmountChildren(c1, parentComponent);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 旧的是文本，新的是空
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 旧的是文本，新的是数组
          mountChildren(c2, el, parentComponent);
        }
      }
    }

    // debugger
  };

  /**
   * 元素更新操作
   * 1.比较元素的差异
   * 2.比较元素的字节点和属性
   * @param n1 旧节点
   * @param n2 新节点
   * @param container
   */
  const patchElement = (n1, n2, container, parentComponent) => {
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el, parentComponent);
  };

  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 创建文本节点
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 文本节点的更新
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  const processFragment = (n1, n2, container, parentComponent) => {
    if (n1 == null) {
      mountChildren(n2.children, container, parentComponent);
    } else {
      patchChildren(n1, n2, container, parentComponent);
    }
  };

  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance, instance.props, next.props || {});

    // 组件更新的时候，需要更新插槽
    Object.assign(instance.slots, next.children);
  };

  function renderComponent(instance) {
    // 1.获取组件的render函数
    const { render, vnode, proxy, props, attrs, slots } = instance;
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      return render.call(proxy, proxy);
    } else {
      // 函数组件
      return vnode.type(attrs, {slots});
    }
  }

  const setupRenderEffect = (instance, container, anchor, parentComponent) => {
    const { render } = instance;
    const componentUpdateFn = () => {
      const { bm, m } = instance;
      // 区分是否是第一次渲染
      if (!instance.isMounted) {
        if (bm) {
          invokeArray(bm);
        }

        // 如果是组件嵌套，subTree是子组件
        const subTree = renderComponent(instance);
        instance.subTree = subTree;
        patch(null, subTree, container, anchor, instance);
        instance.isMounted = true;

        if (m) {
          invokeArray(m);
        }
      } else {
        const { next, bu, u } = instance;
        if (next) {
          // 更新属性和插槽
          updateComponentPreRender(instance, next);
        }

        if (bu) {
          invokeArray(bu);
        }
        const subTree = renderComponent(instance);
        // 实例上的subTree和新的subTree做比较
        patch(instance.subTree, subTree, container, anchor, instance);
        instance.subTree = subTree;

        if (u) {
          invokeArray(u);
        }
      }
    };

    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(update)
    );

    const update = (instance.update = () => effect.run());
    update();
  };

  const mountComponent = (vnode, container, anchor, parentComponent) => {
    // 1.创建组件实例
    const instance = (vnode.component = createComponentInstance(
      vnode,
      parentComponent
    ));

    if (isKeepAlive(vnode)) {
      instance.ctx.renderer = {
        createElement: hostCreateElement, // 内部需要创建一个div缓存dom
        move(vnode, container, anchor) { // 需要把之前渲染的dom放到容器中
          hostInsert(vnode.component.subTree.el, container, anchor)
        },
        unmount
      }
    }
    // 2.给实例的属性赋值
    setupComponent(instance);
    // 3.创建一个effect，让组件的render函数执行
    setupRenderEffect(instance, container, anchor, parentComponent);
  };

  /**
   * 比较两个对象的属性是否有变化
   */
  const hasPropsChange = (prevProps, nextProps) => {
    const nkeys = Object.keys(nextProps);
    if (Object.keys(prevProps).length !== nkeys.length) {
      return true;
    }

    for (let i = 0; i < nkeys.length; i++) {
      const key = nkeys[i];
      if (prevProps[key] !== nextProps[key]) {
        return true;
      }
    }

    return false;
  };

  const updateProps = (instance, prevProps, nextProps) => {
    if (hasPropsChange(prevProps, nextProps)) {
      for (const key in nextProps) {
        // 新的属性覆盖旧的属性
        instance.props[key] = nextProps[key];
      }

      // 移除旧的属性
      for (const key in instance.props) {
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    }
  };

  /**
   * 判断组件是否需要更新
   */
  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;

    if (prevChildren || nextChildren) return true;

    if (prevProps === nextProps) return false;

    return hasPropsChange(prevProps, nextProps || {});
  };

  const updateComponent = (n1, n2) => {
    // 复用组件实例
    const instance = (n2.component = n1.component);
    if (shouldComponentUpdate(n1, n2)) {
      // 更新逻辑
      // 如果调用update有next属性，说明是属性更新，插槽更新
      instance.next = n2;
      instance.update();
    }
  };

  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        // debugger
        // 需要走keepAlive的逻辑
        parentComponent.ctx.activate(n2, container, anchor)
      } else {
        mountComponent(n2, container, anchor, parentComponent);
      }
    } else {
      // debugger
      // 组件更新操作
      updateComponent(n1, n2);
    }
  };

  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    // 两次渲染同一个元素，直接跳过
    if (n1 == n2) return;

    // 移除旧的元素
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1, parentComponent);
      n1 = null;
    }
    const { type, shapeFlag, ref } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          type.process(n1, n2, container, parentComponent, {
            mountChildren,
            patchChildren,
            move(vnode) {
              // 此方法可以将组件或者元素移动到指定的位置
              hostInsert(
                vnode.component ? vnode.component.subTree.el : vnode.el,
                container,
                anchor
              );
            },
          });
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 对组件的处理，Vue3 已经移除了函数式组件
          processComponent(n1, n2, container, anchor, parentComponent);
        }
        break;
    }

    if (ref) {
      // n2 是 dom 还是组件， 还是组件的expose
      setRef(ref, n2);
    }
  };

  function setRef(rawRef, vnode) {
    let value =
      vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
        ? vnode.component.exposed || vnode.component.proxy
        : vnode.el;

    if (isRef(rawRef)) {
      rawRef.value = value;
    }
  }

  /**
   * 删除节点
   */
  const unmount = (vnode, parentComponent) => {
    const { shapeFlag, transition, el } = vnode;
    const performRemove = () => hostRemove(vnode.el); // 删除真实dom

    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      // 需要找到对应的组件实例，调用deactivated方法
      parentComponent.ctx.deactivated(vnode)
    } else if (vnode.type === Fragment) {
      unmountChildren(vnode.children, parentComponent);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      // 组件卸载
      unmount(vnode.component.subTree, parentComponent);
    } else if (shapeFlag & ShapeFlags.TELEPORT) {
      vnode.type.remove(vnode, unmountChildren)
    } else {
      if (transition) {
        transition.leave(el, performRemove)
      } else {
        performRemove();
      }
      // hostRemove(vnode.el); // 删除真实dom
    }
  };

  /**
   * 将虚拟节点变成真是节点进行渲染
   * @param vnode 虚拟节点
   * @param container 容器
   */
  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode, null);
      }
    } else {
      // debugger
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode; // 缓存vnode，方便下次更新使用
    }
  };

  return {
    render,
  };
}
