/* eslint-disable @typescript-eslint/no-unused-vars */

import { FiberNode } from "react-reconciler/src/fiber";
import { HostComponent, HostText } from "react-reconciler/src/workTags";
import { DOMElement, updateFiberProps } from "./SyntheticEvent";
import { Props } from "shared/ReactTypes";

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props): Instance => {
    const element = document.createElement(type) as unknown as DOMElement;
    updateFiberProps(element, props);
    return element
};

export const appendInitialChild = (child: Container, parent: Container) => {
    parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
    const text = document.createTextNode(content);
    return text
};

export const appendChildrenToContainer = appendInitialChild;

export const commitUpdate = (fiber: FiberNode) => {
    switch (fiber.tag) {
        case HostComponent:

            break;
        case HostText:
            commitHostTextUpdate(fiber.stateNode, fiber.memoizedProps.content)
            break;
        default:
            break;
    }
};

const commitHostTextUpdate = (textInstance: TextInstance, text: string) => {
    textInstance.textContent = text;
}

export const removeChild = (chile: Instance | TextInstance, container: Container) => {
    container.removeChild(chile);
}