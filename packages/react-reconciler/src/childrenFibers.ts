import { Props, ReactElementType } from "shared/ReactTypes";
import { createFiberFromElement, createWorkInProgress, FiberNode } from "./fiber";
import { HostText } from "./workTags";
import { ChildDeletion, Placement } from "./fiberFlags";

type ExistingChildren = Map<string | number, FiberNode>;

function useFiber(fiber: FiberNode, pendingProps: Props) {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0;
    clone.sibling = null;
    return clone;
}

function ChildReconciler(shouldTrackEffects: boolean) {

    function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
        if (!shouldTrackEffects) {
            return;
        }
        const deletions = returnFiber.deletions;
        if (deletions === null) {
            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion
            return;
        }
        deletions.push(childToDelete);

    }

    function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
        if (!shouldTrackEffects) {
            return;
        }
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }
    }

    function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
        work: while (currentFiber !== null) {
            // update
            if (element.key === currentFiber.key) {
                if (element.$$type === Symbol.for('react.element')) {
                    if (element.type === currentFiber.type) {
                        const newFiber = useFiber(currentFiber, element.props);
                        newFiber.return = returnFiber;
                        deleteRemainingChildren(returnFiber, currentFiber.sibling)
                        return newFiber;
                    } else {
                        deleteChild(returnFiber, currentFiber);
                        deleteRemainingChildren(returnFiber, currentFiber.sibling)
                        break work;
                    }
                } else {
                    console.warn('还未实现type')
                    break work;
                }
            }
            deleteChild(returnFiber, currentFiber);
            currentFiber = currentFiber.sibling;
        }
        // mount
        const fiber = createFiberFromElement(element)
        fiber.return = returnFiber;
        return fiber;
    }

    function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number) {
        while (currentFiber !== null) {
            // update
            if (currentFiber.tag === HostText) {
                const newFiber = useFiber(currentFiber, { content })
                newFiber.return = returnFiber;
                deleteRemainingChildren(returnFiber, currentFiber.sibling)
                return newFiber;
            }
            deleteChild(returnFiber, currentFiber);
            currentFiber = currentFiber.sibling;
        }
        // mount
        const fiber = new FiberNode(HostText, { content }, null);
        fiber.return = returnFiber;
        return fiber;
    }

    function placeSingleChild(fiber: FiberNode) {
        if (shouldTrackEffects && fiber.alternate === null) {
            fiber.flags |= Placement;
        }
        return fiber;
    }

    function reconcileChildrenArray(returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: any[]) {
        const existingChildren: ExistingChildren = new Map();
        let current = currentFirstChild;
        let firstNewFiber: FiberNode | null = null;
        let lastNewFiber: FiberNode | null = null;
        let lastReuseFiberIndex: number = 0;
        while (current) {
            const key = current.key || current.index;
            existingChildren.set(key, current);
            current = current.sibling;
        }
        // 遍历newChild
        for (let i = 0; i < newChild.length; i++) {
            const after = newChild[i];
            const newFiber = updateFromMap(returnFiber, existingChildren, i, after)
            if (!newFiber) {
                continue;
            }
            newFiber.index = i;
            if (!lastNewFiber) {
                firstNewFiber = lastNewFiber = newFiber
            } else {
                lastNewFiber.sibling = newFiber;
                lastNewFiber = newFiber;
            }

            if (!shouldTrackEffects) {
                continue;
            }

            if (newFiber.alternate) {
                const alternate = newFiber.alternate;
                if (lastReuseFiberIndex > alternate.index) {
                    newFiber.flags |= Placement;
                    continue
                } else {
                    lastReuseFiberIndex = alternate.index;
                }
            } else {
                newFiber.flags |= Placement;
            }
        }
        existingChildren.forEach((child) => {
            deleteChild(returnFiber, child)
        })
        return firstNewFiber;

    }

    function updateFromMap(returnFiber: FiberNode, existingChildren: ExistingChildren, index: number, element: any) {
        const key = element.key || index;
        const before = existingChildren.get(key);
        if (typeof element === 'string' || typeof element === 'number') {
            if (before) {
                if (before.tag === HostText) {
                    existingChildren.delete(key);
                    return useFiber(before, { content: element + '' })
                }
            }
            return new FiberNode(HostText, { content: element + '' }, null)
        }
        if (typeof element === 'object' && element !== null) {
            switch (element.$$type) {
                case Symbol.for('react.element'):
                    if (before) {
                        if (before.type === element.type) {
                            existingChildren.delete(key);
                            return useFiber(before, element.props,)
                        }
                    }
                    return createFiberFromElement(element)
                default:
                    break;
            }
        }
    }

    return function (returnFiber: FiberNode, currentFiber: FiberNode | null, newChild?: ReactElementType) {
        if (typeof newChild === 'object' && newChild !== null) {

            if (Array.isArray(newChild)) {
                return reconcileChildrenArray(returnFiber, currentFiber, newChild)
            }

            switch (newChild.$$type) {
                case Symbol.for('react.element'):
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild))
                default:
                    console.warn('未实现的reconcile类型', newChild);
                    break;
            }
        }
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild))
        }
        return null;
    }
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);