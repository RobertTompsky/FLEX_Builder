import type {
    CapabilityExecutionContext,
    CapabilityPlugin,
    EmptyContext,
} from "./types";

type DefineCapabilityInput<
    TContext extends CapabilityExecutionContext,
> = CapabilityPlugin<TContext>;

export function defineCapability<
    TContext extends CapabilityExecutionContext =
        EmptyContext,
>(
    plugin:
        DefineCapabilityInput<TContext>,
): CapabilityPlugin<TContext> {
    return plugin;
}