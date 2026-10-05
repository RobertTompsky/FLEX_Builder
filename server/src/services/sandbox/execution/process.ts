import type {
    RpcTransport,
} from "../../rpc/transport";


export interface ExecutionProcess {
    readonly pid: number;

    readonly rpc: RpcTransport;

    readonly stdout: ReadableStream<Uint8Array>;

    readonly stderr: ReadableStream<Uint8Array>;

    readonly exited: Promise<number | null>;

    kill(): void;
}