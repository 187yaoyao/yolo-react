/* eslint-disable no-constant-condition */
import { FiberNode, FiberRootNode } from "./fiber";
import { ChildDeletion, MutationMask, NoFlags, Placement, Update } from "./fiberFlags";
import { appendChildrenToContainer, commitUpdate, Container, removeChild } from "hostConfig";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./workTags";

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {

    nextEffect = finishedWork;
    while (nextEffect) {
        const child: FiberNode | null = nextEffect.child;
        if (nextEffect.subTreeFlags && (nextEffect.subTreeFlags & MutationMask) !== NoFlags) {
            nextEffect = child;
        } else {
            up: while (nextEffect) {
                commitMutationEffectOnFiber(nextEffect);
                const sibling: FiberNode | null = nextEffect.sibling;
                if (sibling) {
                    nextEffect = sibling;
                    break up;
                }
                nextEffect = nextEffect.return;
            }
        }
    }
    return;
};

const commitMutationEffectOnFiber = (finishedWork: FiberNode) => {

    const flags = finishedWork.flags;
    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
    if ((flags & ChildDeletion) !== NoFlags) {
        const deletions = finishedWork.deletions;
        if (deletions !== null) {
            deletions.forEach(commitDeletion);
        }
    }
    if ((flags & Update) !== NoFlags) {

        commitUpdate(finishedWork);
        finishedWork.flags &= ~Update;
    }

}

const commitDeletion = (childToDelete: FiberNode) => {
    let delNodeFiber: FiberNode | null = null;
    commitNestedComponent(childToDelete, (fiber: FiberNode) => {
        switch (fiber.tag) {
            case HostComponent:
                if (delNodeFiber === null) {
                    delNodeFiber = fiber;
                }
                return;
            case HostText:
                if (delNodeFiber === null) {
                    delNodeFiber = fiber;
                }
                return;
            case FunctionComponent:
                return;
            default:
                break;
        }
    });
    if (delNodeFiber) {
        const parentNode = getHostParent(delNodeFiber);
        if (parentNode) {
            removeChild((delNodeFiber as FiberNode).stateNode, parentNode)
        }
    }
    childToDelete.return = null;
    childToDelete.child = null;
}

const commitNestedComponent = (root: FiberNode, unmountCallback: (fiber: FiberNode) => void) => {
    let node = root;
    while (true) {
        unmountCallback(node);
        if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === root) {
            return;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === root) {
                return;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
}

const commitPlacement = (finishedWork: FiberNode) => {
    const hostParent = getHostParent(finishedWork);
    appendPlacementNode(finishedWork, hostParent);
}

function getHostParent(fiber: FiberNode): Container {
    let parent = fiber.return;
    while (parent) {
        const parentTag = parent.tag;
        if (parentTag === HostComponent) {
            return parent.stateNode as Container;
        }
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container;
        }
        parent = parent.return;
    }
    throw new Error('getHostParent error');
}

function appendPlacementNode(finishedWork: FiberNode, hostParent: Container) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        appendChildrenToContainer(finishedWork.stateNode, hostParent);
        return;
    }
    const child = finishedWork.child;
    if (child !== null) {
        appendPlacementNode(child, hostParent);
        let sibling = child.sibling;
        while (sibling !== null) {
            appendPlacementNode(sibling, hostParent);
            sibling = sibling.sibling;
        }
    }
}