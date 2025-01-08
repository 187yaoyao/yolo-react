import { Dispatch } from "react/src/currentDispatcher";
import { Action } from "shared/ReactTypes";

export interface Update<State> {
    action: Action<State>;
}

export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null;
    };
    dispatch?: Dispatch<State>
}

export function createUpdate<State>(action: Action<State>) {
    return {
        action
    }
}

export function createUpdateQueue<State>(): UpdateQueue<State> {
    return {
        shared: {
            pending: null
        }
    }
}

export function enqueueUpdate<State>(updateQueue: UpdateQueue<State>, update: Update<State>) {
    updateQueue.shared.pending = update
}

export function processUpdateQueue<State>(baseState: State, pendingUpdate: Update<State>) {
    const result: {
        memoizedState: State | null
    } = { memoizedState: null }

    if (pendingUpdate) {
        const action = pendingUpdate.action;
        if (action instanceof Function) {
            result.memoizedState = action(baseState);
        } else {
            result.memoizedState = action;
        }
    }

    return result
}