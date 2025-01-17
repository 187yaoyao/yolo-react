import { ReactElementType } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import { processUpdateQueue, Update, UpdateQueue } from "./updateQueue";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./workTags";
import { mountChildFibers, reconcileChildFibers } from "./childrenFibers";
import { renderWithHooks } from "./fiberHook";

export function beginWork(wip: FiberNode): FiberNode | null {

    switch (wip.tag) {
        case HostRoot:
            return updateHostRoot(wip);
        case HostComponent:
            return updateHostComponent(wip);
        case FunctionComponent:
            return updateFunctionComponent(wip);
        case HostText:

            return null;
        default:
            return null;
    }
}

function updateHostRoot(wip: FiberNode) {
    const baseState = wip.memoizedState;
    const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>;
    const pending = updateQueue.shared.pending;
    updateQueue.shared.pending = null;
    const { memoizedState } = processUpdateQueue(baseState, pending as Update<ReactElementType>);
    memoizedState && (wip.memoizedState = memoizedState)
    const nextChildren = wip.memoizedState;
    reconcileChildren(wip, nextChildren);
    return wip.child;
}

function updateHostComponent(wip: FiberNode) {
    const nextProps = wip.pendingProps;
    const nextChildren = nextProps.children;
    reconcileChildren(wip, nextChildren);
    return wip.child;
}

function reconcileChildren(wip: FiberNode, children: ReactElementType) {
    const current = wip.alternate;
    if (current !== null) {
        // update
        wip.child = reconcileChildFibers(wip, current?.child, children);
    } else {
        // mount
        wip.child = mountChildFibers(wip, null, children);
    }
}

function updateFunctionComponent(wip: FiberNode) {
    const nextChildren = renderWithHooks(wip);
    reconcileChildren(wip, nextChildren);
    return wip.child;
}