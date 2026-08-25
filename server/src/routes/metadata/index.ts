import Elysia from "elysia";
import { MetadataResponse } from "@flex-builder/shared/agent";
import { CapabilityAccessSchema } from "@flex-builder/shared/capabilities";
import { MODELS } from "@flex-builder/shared/data";
import { HookPoliciesInfo } from "@flex-builder/shared/hooks";
import { listPreToolUsePolicies } from "../../agents/harness/hooks/preToolUse/policy";
import { listCapabilities } from "../../runtime/execute/resolveCapabilities";
import { CAPABILITIES_DIR, UPLOADS_DIR } from "../../shared/data";
import fs from 'fs-extra'

export function metadataRoutes() {
  return new Elysia({
    prefix: "/metadata",
  }).get("/", async () => {
    const definitions = await listCapabilities(
      CAPABILITIES_DIR,
    );

    const uploads = fs
      .readdirSync(
        UPLOADS_DIR,
        {
          withFileTypes: true,
        },
      )
      .filter((entry) =>
        entry.isFile(),
      )
      .map((entry) => entry.name)
      .sort((a, b) =>
        a.localeCompare(b),
      );

    const policies: HookPoliciesInfo = {
      preToolUse:
        listPreToolUsePolicies(),
    };

    return {
      uploads,
      models: MODELS,
      capabilities: {
        items: definitions.map(
          ({
            id,
            description,
          }) => ({
            id,
            description,
          }),
        ),
        accessOptions:
          CapabilityAccessSchema.options,
      },
      policies,
    } satisfies MetadataResponse;
  });
}