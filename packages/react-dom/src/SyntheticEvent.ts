/* eslint-disable @typescript-eslint/unbound-method */
import { Container } from "hostConfig";
import { Props } from "shared/ReactTypes";

export const elementPropsKey = '__props';

export interface DOMElement extends Element {
    [elementPropsKey]: Props
}

type EventCallback = (e: Event) => void;
interface Paths {
    capture: EventCallback[];
    bubble: EventCallback[];
}

interface SyntheticEvent extends Event {
    __stopPropagation: boolean;
}

const validEventTypeList = ['click'];

function getEventCallbackNameFromEventType(eventType: string): undefined | string[] {
    return {
        click: ['onClickCapture', 'onClick']
    }[eventType]
}

export function updateFiberProps(dom: DOMElement, props: Props) {
    dom[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
    if (!validEventTypeList.includes(eventType)) {
        console.warn('当前不支持', eventType, '事件');
        return;
    }
    container.addEventListener(eventType, e => {
        dispatchEvent(container, eventType, e);
    })
}

function createSyntheticEvent(e: Event) {
    const syntheticEvent = e as SyntheticEvent;
    syntheticEvent.__stopPropagation = false;
    const originStopPropagation = e.stopPropagation;
    syntheticEvent.stopPropagation = () => {
        syntheticEvent.__stopPropagation = true;
        if (originStopPropagation) {
            originStopPropagation();
        }
    }
    return syntheticEvent;
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
    for (let i = 0; i < paths.length; i++) {
        const callback = paths[i];
        callback.call(null, se);
        if (se.__stopPropagation) {
            break;
        }
    }
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
    const targetElement = e.target;
    if (targetElement === null) {
        console.warn('事件不存在target', e);
        return;
    }
    // 1. 收集沿途的事件
    const { capture, bubble } = collectPaths(targetElement as DOMElement, container, eventType);
    // 2. 构造合成事件
    const se = createSyntheticEvent(e);
    // 3. 遍历捕获阶段
    triggerEventFlow(capture, se);
    // 4. 遍历冒泡阶段
    if (!se.__stopPropagation) {
        triggerEventFlow(bubble, se);
    }
}
/**
 * 收集从目标元素到容器元素的事件回调路径
 * @param targetElement - 事件触发的目标元素
 * @param container - 事件监听的容器元素
 * @param type - 事件类型
 * @returns 包含捕获和冒泡阶段事件回调的路径对象
 */
function collectPaths(targetElement: DOMElement, container: Container, type: string) {
    const paths: Paths = {
        bubble: [],
        capture: []
    }
    // 从目标元素开始，向上遍历DOM树，直到到达容器元素
    while (targetElement && targetElement !== container) {
        // 获取目标元素的属性对象
        const elementProps = targetElement[elementPropsKey];
        // 如果属性对象存在
        if (elementProps) {
            // 根据事件类型获取对应的回调函数名称列表
            const callbackNameList = getEventCallbackNameFromEventType(type);
            // 如果回调函数名称列表存在
            if (callbackNameList) {
                // 遍历回调函数名称列表
                callbackNameList.forEach(callbackName => {
                    // 获取当前回调函数
                    const eventCallback = elementProps[callbackName];
                    // 如果当前回调函数存在
                    if (eventCallback) {
                        // 如果回调函数名称包含'Capture'，则将其添加到捕获阶段的路径中
                        if (callbackName.indexOf('Capture') !== -1) {
                            paths.capture.unshift(eventCallback);
                            // 否则将其添加到冒泡阶段的路径中
                        } else {
                            paths.bubble.push(eventCallback);
                        }
                    }
                })
            }
            // 将目标元素更新为其父节点
            targetElement = targetElement.parentNode as DOMElement;
        }
        // 返回收集到的路径对象
        return paths;
    }
    // 如果没有找到目标元素，返回空的路径对象
    return paths;
}