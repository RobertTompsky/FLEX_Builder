import { ExecutableAction } from "./types";

export function createCapabilityExecutor(
    actions:
        ReadonlyMap<
            string,
            ExecutableAction
        >,
) {
    return async function executeCapability(
        actionName: string,
        args: unknown,
        signal?: AbortSignal,
    ): Promise<unknown> {
        const execute =
            actions.get(
                actionName,
            );

        if (!execute) {
            throw new Error(
                `Unknown action "${actionName}"`,
            );
        }

        return execute(
            args,
            {
                signal,
            },
        );
    };
}