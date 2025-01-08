import { FiberNode } from "./fiber";
import { NoFlags, Update } from "./fiberFlags";
import { appendInitialChild, createInstance, createTextInstance, Instance } from "hostConfig";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./workTags";
import { updateFiberProps } from "react-dom/src/SyntheticEvent";

export function completeWork(wip: FiberNode) {
    const newProps = wip.pendingProps;
    const current = wip.alternate;
    switch (wip.tag) {
        case HostComponent:
            if (current !== null && wip.stateNode) {
                // update
                updateFiberProps(wip.stateNode, newProps);
            } else {
                // mount
                const instance = createInstance(wip.type, newProps);
                appendAllChildren(instance, wip);
                wip.stateNode = instance;
            }
            bubbleProperties(wip);
            break;
        case HostText:
            if (current !== null && wip.stateNode) {
                // update
                const oldText = current.memoizedProps.content;
                const newText = newProps.content;
                if (oldText !== newText) {
                    markUpdate(wip);
                }
            } else {
                // mount
                const instance = createTextInstance(newProps.content);
                wip.stateNode = instance;
            }
            bubbleProperties(wip);
            break;
        case HostRoot:

            bubbleProperties(wip);
            break;
        case FunctionComponent:

            bubbleProperties(wip);
            break;
        default:
            break;
    }
}

function appendAllChildren(parent: Instance, wip: FiberNode) {
    let node = wip.child;
    while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(node.stateNode, parent);
        } else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === wip) {
            return;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === wip) {
                return;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
}

function bubbleProperties(wip: FiberNode) {
    let subTreeFlags = NoFlags;
    let child = wip.child;
    while (child !== null) {
        subTreeFlags |= child.subTreeFlags;
        subTreeFlags |= child.flags;
        child.return = wip;
        child = child.sibling;
    }
    wip.subTreeFlags = subTreeFlags;
}

function markUpdate(fiber: FiberNode) {

    fiber.flags |= Update;
}