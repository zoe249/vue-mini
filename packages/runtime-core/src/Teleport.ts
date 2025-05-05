import { ShapeFlags } from "@vue/shared"

export const Teleport = {
    __isTeleport: true,
    process(n1, n2, anchor, parentComponent, internals) {
        let { mountChildren, patchChildren, move } = internals

        if (!n1) {
            // 初始化
            const target = n2.target = document.querySelector(n2.props.to)
            if (target) {
                mountChildren(n2.children, target, parentComponent)
            }
        } else {
            patchChildren(n1, n2, n2.target, parentComponent, internals)
            if (n2.props.to !== n1.props.to) {
                const nextTarget = document.querySelector(n2.props.to)
                n2.children.forEach(child => move(child, nextTarget, anchor))
            }
        }
    },
    remove(vnode, unmountChildren) {
        const { shapeFlag, children } = vnode
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(children)
        }
    }
}

export const isTeleport = (value) => value.__isTeleport