import { Dispatch, Dispatcher } from "react/src/currentDispatcher";
import { FiberNode } from "./fiber";
import internals from "shared/internals";
import { createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue, UpdateQueue } from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";

export interface Hook {
    memoizedState: any;
    updateQueue: unknown;
    next: Hook | null;
}

const { currentDispatcher } = internals;
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks(wip: FiberNode) {

    currentlyRenderingFiber = wip;
    wip.memoizedState = null;

    const current = wip.alternate;
    if (current) {
        // update
        currentDispatcher.current = HookDispatchOnUpdate;
    } else {
        // mount
        currentDispatcher.current = HooksDispatcherOnMount;
    }

    const component = wip.type;
    const props = wip.pendingProps;
    const nextChildren = component(props);
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
    return nextChildren
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState
}

const HookDispatchOnUpdate: Dispatcher = {
    useState: updateState
}

function mountState<State>(initState: (State | (() => State))): [State, Dispatch<State>] {
    const hook = mountWorkInProgressHook();
    let memoizedState;
    if (initState instanceof Function) {
        memoizedState = initState();
    } else {
        memoizedState = initState;
    }
    const queue = createUpdateQueue<State>();
    hook.updateQueue = queue;
    const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber!, queue as any);
    queue.dispatch = dispatch
    return [memoizedState, dispatch]
}

function updateState<State>(): [State, Dispatch<State>] {
    const hook = updateWorkInProgressHook();
    const queue = hook.updateQueue as UpdateQueue<State>;
    const pending = queue.shared.pending;
    if (pending !== null) {
        const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
        hook.memoizedState = memoizedState
    }
    return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

function dispatchSetState<State>(fiber: FiberNode, updateQueue: UpdateQueue<State>, action: Action<State>) {
    const update = createUpdate(action);
    enqueueUpdate(updateQueue, update);
    scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null,
        updateQueue: null,
        next: null
    }
    if (workInProgressHook === null) {
        if (currentlyRenderingFiber === null) {
            throw new Error('请在函数组件内调用hook')
        } else {
            currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
        }
    } else {
        workInProgressHook.next = hook;
    }
    return workInProgressHook;
}

function updateWorkInProgressHook(): Hook {

    let nextCurrentHook: Hook | null = null
    if (currentHook === null) {
        const current = currentlyRenderingFiber?.alternate;
        if (current) {
            nextCurrentHook = current.memoizedState
        } else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = currentHook.next;
    }
    if (nextCurrentHook === null) {
        throw new Error('hook数量不一致')
    }
    currentHook = nextCurrentHook;
    const hook = {
        memoizedState: currentHook.memoizedState,
        updateQueue: currentHook.updateQueue,
        next: null
    }
    if (workInProgressHook === null) {
        if (currentlyRenderingFiber === null) {
            throw new Error('请在函数组件内调用hook')
        } else {
            currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
        }
    } else {
        workInProgressHook.next = hook;
    }
    return workInProgressHook;
}