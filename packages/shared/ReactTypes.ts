export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;

export interface ReactElementType {
    $$type: symbol;
    key: Key;
    ref: Ref;
    props: Props;
    type: Type;
    __mark: string;
}

export type Action<State> = State | ((s: State) => State);