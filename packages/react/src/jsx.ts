/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type, Key, Ref, Props, ReactElementType } from 'shared/ReactTypes';

const ReactElement = function (
    type: Type,
    key: Key,
    ref: Ref,
    props: Props
): ReactElementType {
    const element = {
        $$type: Symbol.for('react.element'),
        type,
        key,
        ref,
        props,
        __mark: 'yolo'
    }
    return element;
};

export const jsx = (
    type: Type,
    config: any,
    ...children: any
) => {
    let key: Key = null,
        ref: Ref = null;
    const props: Props = {};

    for (const prop in config) {
        if (prop === 'key') {
            if (config[prop] !== void 0) {
                key = config[prop];
            }
            continue;
        }
        if (prop === 'ref') {
            if (config[prop] !== void 0) {
                ref = config[prop];
            }
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(config, prop)) {
            props[prop] = config[prop];
        }
    }

    const childrenElementLength = children.length;
    if (childrenElementLength) {
        if (childrenElementLength === 1) {
            props.children = children[0];
        } else {
            props.children = children;
        }
    }

    return ReactElement(type, key, ref, props);
}

export const jsxDEV = (
    type: Type,
    config: any,

) => {
    let key: Key = null,
        ref: Ref = null;
    const props: Props = {};

    for (const prop in config) {
        if (prop === 'key') {
            if (config[prop] !== void 0) {
                key = config[prop];
            }
            continue;
        }
        if (prop === 'ref') {
            if (config[prop] !== void 0) {
                ref = config[prop];
            }
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(config, prop)) {
            props[prop] = config[prop];
        }
    }


    return ReactElement(type, key, ref, props);
};