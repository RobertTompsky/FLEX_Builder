export type CapabilityRpcRequest =
    | CapabilityRpcCall
    | CapabilityRpcCancel;

export type CapabilityRpcCall = {
    type: "capability_call";
    id: string;
    action: string;
    args: unknown;
};

export type CapabilityRpcCancel = {
    type: "capability_cancel";
    id: string;
};

export type CapabilityRpcSuccess = {
    type: "capability_result";
    id: string;
    ok: true;
    result: unknown;
};

export type CapabilityRpcError = {
    type: "capability_result";
    id: string;
    ok: false;
    error: string;
};

export type CapabilityRpcResponse =
    | CapabilityRpcSuccess
    | CapabilityRpcError;

export type CapabilityRpcMessage =
    | CapabilityRpcRequest
    | CapabilityRpcResponse;