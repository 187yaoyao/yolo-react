import { ReactElementType } from "shared/ReactTypes";
import { FiberNode, FiberRootNode } from "./fiber";
import { Container } from "hostConfig";
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from "./updateQueue";
import { HostRoot } from "./workTags";
import { renderRoot } from "./workLoop";

export function createContainer(container: Container) {
    const hostRootFiber = new FiberNode(HostRoot, {}, null);
    const fiberRootNode = new FiberRootNode(container, hostRootFiber);
    hostRootFiber.updateQueue = createUpdateQueue();
    return fiberRootNode;
}

export function updateContainer(element: ReactElementType, root: FiberRootNode) {
    const hostRootFiber = root.current;
    const update = createUpdate<ReactElementType>(element);
    const updateQueue = hostRootFiber.updateQueue;
    enqueueUpdate(updateQueue as UpdateQueue<ReactElementType>, update);
    renderRoot(root)
    return element;
}