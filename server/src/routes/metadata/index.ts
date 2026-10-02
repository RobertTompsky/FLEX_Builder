import Elysia from "elysia";
import { CapabilityAccessSchema } from "@flex-builder/shared/capabilities";
import { MODELS } from "@flex-builder/shared/data";
import { HookPoliciesInfo } from "@flex-builder/shared/hooks";
import { UPLOADS_DIR } from "../../shared/data";
import fs from 'fs-extra'
import { listPreToolUsePolicies } from "../../services/agent/hooks/preToolUse/policy";
import { CAPABILITY_DEFINITIONS } from "../../capabilities";
import { MetadataResponse } from "@flex-builder/shared/metadata";

export function metadataRoutes() {
  return new Elysia({
    prefix: "/metadata",
  })
    .get("/", async () => {
      const uploads = fs
        .readdirSync(
          UPLOADS_DIR,
          {
            withFileTypes: true,
          },
        )
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

      const policies: HookPoliciesInfo = {
        preToolUse: listPreToolUsePolicies(),
      };

      return {
        uploads,
        models: MODELS,
        capabilities: {
          items: CAPABILITY_DEFINITIONS.map(
            ({
              id,
              description,
            }) => ({
              id,
              description,
            }),
          ),
          accessOptions: CapabilityAccessSchema.options,
        },
        policies,
      } satisfies MetadataResponse;
    });
}