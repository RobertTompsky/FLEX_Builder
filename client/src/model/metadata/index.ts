import {
    action,
    withAsyncData,
    wrap,
} from "@reatom/core";
import {
    metadataApi
} from "../../api/metadata";
import type { MetadataResponse } from "@flex-builder/shared/agent";

const load = action(
    async (
        signal?: AbortSignal,
    ): Promise<MetadataResponse> => {
        return await wrap(
            metadataApi.get(signal),
        );
    },
    "metadata.load",
).extend(
    withAsyncData({
        initState: null as MetadataResponse | null,
    }),
);

export const metadata = {
    load,
    data: load.data,
};