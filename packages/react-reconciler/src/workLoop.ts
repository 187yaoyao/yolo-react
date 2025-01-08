/* eslint-disable no-constant-condition */
import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { createWorkInProgress, FiberNode, FiberRootNode } from "./fiber";
import { MutationMask, NoFlags } from "./fiberFlags";
import { HostRoot } from "./workTags";

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
    workInProgress = createWorkInProgress(root.current, {});
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    let parent = node.return;
    while (parent) {
        node = parent
        parent = parent.return
    }
    if (node.tag === HostRoot) {
        return node.stateNode
    }
    return null;
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
    const fiberRootNode = markUpdateFromFiberToRoot(fiber);
    renderRoot(fiberRootNode);
}

export function renderRoot(root: FiberRootNode) {

    prepareFreshStack(root);
    do {
        try {
            workLoop();
            break;
        } catch (e) {
            console.warn('workLoop发生错误', e);
            workInProgress = null;
        }
    } while (true)
    root.finishedWork = root.current.alternate;

    commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork;
    if (finishedWork === null) return;
    root.finishedWork = null;
    const subtreeHasEffect = (finishedWork.subTreeFlags & MutationMask) !== NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
    if (subtreeHasEffect || rootHasEffect) {
        root.current = finishedWork;
        commitMutationEffects(finishedWork);
    } else {
        root.current = finishedWork;
    }
}

function workLoop() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber);

    fiber.memoizedProps = fiber.pendingProps;
    if (next === null) {
        completeUnitOfWork(fiber);
    } else {
        workInProgress = next;
    }
}

function completeUnitOfWork(fiber: FiberNode) {

    let node: FiberNode | null = fiber;
    do {
        completeWork(node);
        const sibling = node.sibling;
        if (sibling !== null) {
            workInProgress = sibling;
            return;
        }
        node = node.return;
        workInProgress = node;
    } while (node !== null)
}