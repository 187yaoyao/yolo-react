import { Key, Props, ReactElementType } from "shared/ReactTypes";
import { FunctionComponent, HostComponent, Tag } from "./workTags";
import { Flag, NoFlags } from "./fiberFlags";
import { Container } from "hostConfig";

export class FiberNode {
    tag: Tag;
    key: Key;
    type: any;
    stateNode: any;
    return: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    index: number;
    alternate: FiberNode | null;
    pendingProps: Props;
    memoizedProps: Props | null;
    flags: Flag;
    updateQueue: unknown;
    memoizedState: any;
    subTreeFlags: Flag;
    deletions: FiberNode[] | null;

    constructor(tag: Tag, pendingProps: Props, key: Key) {
        this.tag = tag;
        this.key = key || null;
        this.type = null;
        this.stateNode = null;

        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;

        this.pendingProps = pendingProps;
        this.memoizedProps = null;
        this.alternate = null;
        this.updateQueue = null;
        this.memoizedState = null;

        this.flags = NoFlags;
        this.subTreeFlags = NoFlags;
        this.deletions = null;


    }
}

export class FiberRootNode {
    container: Container;
    current: FiberNode;
    finishedWork: FiberNode | null;
    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container;
        this.current = hostRootFiber;
        hostRootFiber.stateNode = this;
        this.finishedWork = null;
    }
}

export function createWorkInProgress(current: FiberNode, pendingProps: Props) {
    let wip = current.alternate;
    if (wip === null) {
        // mount
        wip = new FiberNode(current.tag, pendingProps, current.key);
        wip.type = current.type;
        wip.stateNode = current.stateNode;
        wip.alternate = current;
        current.alternate = wip;
    } else {
        // update
        wip.pendingProps = pendingProps;
        wip.flags = NoFlags
        wip.subTreeFlags = NoFlags
        wip.deletions = null;
    }
    wip.type = current.type;
    wip.updateQueue = current.updateQueue;
    wip.child = current.child;
    wip
    wip.memoizedProps = current.memoizedProps;
    wip.memoizedState = current.memoizedState;
    return wip;
}

export function createFiberFromElement(element: ReactElementType) {
    const { type, key, props } = element;
    let defaultTag: Tag = FunctionComponent;
    if (typeof type === 'string') {
        defaultTag = HostComponent;
    } else if (typeof type !== 'function') {
        console.warn('未实现的type', element);
    }
    const fiber = new FiberNode(defaultTag, props, key);
    fiber.type = type;
    return fiber;
}