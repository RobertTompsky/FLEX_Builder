import {
  reatomComponent,
  bindField,
} from "@reatom/react";

import type {
  AgentModel,
} from "../../model/agents/model";

import {
  metadata,
} from "../../model/metadata";

import styles from "./styles.module.scss";
import type { AgentCapabilityConfig } from "@flex-builder/shared/capabilities";

type AgentConfigPanelProps = {
  agent: AgentModel;
};

const ACCESS_LABELS = {
  execute: "EXEC",
  delegate: "DEL",
  both: "BOTH",
} as const;

export const AgentConfigPanel =
  reatomComponent(({
    agent,
  }: AgentConfigPanelProps) => {
    const metadataData = metadata.data();
    const metadataError = metadata.load.error();

    const {
      name,
      model,
      maxTurns,
      prompt,
      capabilities,
      policies,
    } = agent.configForm.fields;

    const nameValue = name();
    const modelValue = model();
    const maxTurnsValue = maxTurns();
    const promptValue = prompt();
    const capabilitiesValue = capabilities();
    const preToolUseValue = policies.preToolUse();

    const models =
      metadataData
        ? Object.values(
          metadataData.models,
        )
        : [];

    const capabilityItems =
      metadataData
        ?.capabilities.items ??
      [];

    const accessOptions =
      metadataData
        ?.capabilities
        .accessOptions ??
      [];

    const policyOptions =
      metadataData
        ?.policies.preToolUse ??
      [];

    const getCapability = (
      capabilityId: string,
    ) =>
      capabilitiesValue.find(
        (capability) =>
          capability.id ===
          capabilityId,
      );

    const toggleCapability = (
      capabilityId: string,
    ): void => {
      const existing =
        getCapability(
          capabilityId,
        );

      if (existing) {
        capabilities.change(
          capabilitiesValue.filter(
            (capability) =>
              capability.id !==
              capabilityId,
          ),
        );

        return;
      }

      const defaultAccess = accessOptions[0];

      if (!defaultAccess) return;

      capabilities.change([
        ...capabilitiesValue,
        {
          id: capabilityId,
          access:
            defaultAccess,
        },
      ]);
    };

    const setCapabilityAccess = (
      capabilityId: string,
      access: AgentCapabilityConfig["access"],
    ): void => {
      capabilities.change(
        capabilitiesValue.map(
          (capability) =>
            capability.id ===
              capabilityId
              ? {
                ...capability,
                access,
              }
              : capability,
        ),
      );
    };

    const selectedPreToolUsePolicy =
      policyOptions.find(
        (policy) =>
          policy.id ===
          preToolUseValue,
      );

    return (
      <aside
        className={styles.bios}
      >
        <header
          className={
            styles.header
          }
        >
          <span
            className={
              styles.logo
            }
            aria-hidden="true"
          >
            ▐█▌
          </span>

          <span
            className={
              styles.title
            }
          >
            SETUP UTILITY
          </span>

          <span
            className={
              styles.version
            }
          >
            v2.2.8
          </span>
        </header>

        <div
          className={styles.body}
        >
          {!metadataData ? (
            <span
              className={
                styles.hint
              }
            >
              SCANNING...
            </span>
          ) : (
            <div
              className={
                styles.section
              }
            >
              <div
                className={
                  styles.row
                }
              >
                <label
                  className={
                    styles.label
                  }
                  htmlFor={
                    "agent-name"
                  }
                >
                  Agent Name
                </label>

                <input
                  id="agent-name"
                  className={styles.input}
                  type="text"
                  placeholder="default"
                  {...bindField(name)}
                />
              </div>

              <div
                className={
                  styles.row
                }
              >
                <label
                  className={
                    styles.label
                  }
                  htmlFor={
                    "agent-model"
                  }
                >
                  Model
                </label>

                <select
                  id="agent-model"
                  className={styles.select}
                  disabled={models.length === 0}
                  {...bindField(model)}
                >
                  <option value="">
                    [Select]
                  </option>

                  {models.map((modelName) => (
                    <option
                      key={modelName}
                      value={modelName}
                    >
                      {modelName}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={
                  styles.row
                }
              >
                <label
                  className={
                    styles.label
                  }
                  htmlFor={
                    "agent-max-turns"
                  }
                >
                  Max Turns
                </label>

                <input
                  id="agent-max-turns"
                  className={
                    styles.input
                  }
                  type="number"
                  min={1}
                  max={10}
                  value={
                    maxTurnsValue
                  }
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event
                        .currentTarget
                        .valueAsNumber;

                    if (
                      Number.isNaN(
                        value,
                      )
                    ) {
                      return;
                    }

                    maxTurns.change(
                      value,
                    );
                  }}
                />
              </div>

              <div
                className={
                  styles.divider
                }
              />

              <div
                className={styles.group}
              >
                <label className={styles.groupTitle}>
                  Capabilities
                </label>

                <div
                  className={
                    styles.capabilities
                  }
                >
                  {capabilityItems
                    .length === 0 && (
                      <span
                        className={
                          styles.hint
                        }
                      >
                        No capabilities
                        detected
                      </span>
                    )}

                  {capabilityItems.map((item) => {
                    const selected =
                      getCapability(item.id);

                    return (
                      <div className={styles.capability} key={item.id}>
                        <div
                          className={
                            styles.capabilityInfo
                          }
                        >
                          <button
                            type="button"
                            className={[
                              styles.chip,
                              selected &&
                              styles.active,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              toggleCapability(
                                item.id,
                              );
                            }}
                          >
                            <span
                              className={
                                styles.chipIndicator
                              }
                            >
                              {selected ? "■" : "□"}
                            </span>

                            <span
                              className={
                                styles.capabilityName
                              }
                            >
                              {item.id}
                            </span>
                          </button>

                          {item.description && (
                            <Tooltip
                              text={
                                item.description
                              }
                            />
                          )}
                        </div>

                        <div className={styles.accessOptions}>
                          {accessOptions.map((access) => {
                            const active =
                              selected?.access === access;

                            return (
                              <button
                                title={access}
                                key={access}
                                type="button"
                                disabled={!selected}
                                className={[
                                  styles.accessButton,
                                  active && styles.active,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                onClick={() => {
                                  setCapabilityAccess(
                                    item.id,
                                    access,
                                  );
                                }}
                              >
                                {ACCESS_LABELS[access]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className={styles.divider}
              />

              <div className={styles.group}>
                <div
                  className={
                    styles.groupTitle
                  }
                >
                  Hooks
                </div>

                <div className={styles.row}>
                  <label
                    className={styles.label}
                    htmlFor="agent-pre-tool-use"
                  >
                    <span
                      className={
                        styles.labelContent
                      }
                    >
                      Pre Tool Use

                      {selectedPreToolUsePolicy
                        ?.description && (
                          <Tooltip
                            text={
                              selectedPreToolUsePolicy
                                .description
                            }
                          />
                        )}
                    </span>
                  </label>

                  <select
                    id="agent-pre-tool-use"
                    className={styles.select}
                    value={preToolUseValue}
                    onChange={(event) => {
                      policies.preToolUse.change(
                        event.currentTarget
                          .value as
                        typeof preToolUseValue,
                      );
                    }}
                  >
                    {policyOptions.map(
                      (policy) => (
                        <option
                          key={policy.id}
                          value={policy.id}
                        >
                          {policy.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div
                className={
                  styles.divider
                }
              />

              <div
                className={styles.group}
              >
                <label
                  className={styles.groupTitle}
                  htmlFor="agent-prompt"
                >
                  System Prompt
                </label>

                <textarea
                  id="agent-prompt"
                  className={styles.textarea}
                  rows={5}
                  placeholder="You are a helpful agent."
                  {...bindField(prompt)}
                />
              </div>
            </div>
          )}

          {metadataError && (
            <div
              className={
                styles.error
              }
              role="alert"
            >
              !!{" "}
              {
                metadataError.message
              }
            </div>
          )}
        </div>

        <footer
          className={
            styles.footer
          }
        >
          <span>
            ↑↓: Select
          </span>
        </footer>
      </aside>
    );
  });

type TooltipProps = {
  text: string;
};

function Tooltip({
  text,
}: TooltipProps) {
  return (
    <span
      className={styles.tooltip}
      tabIndex={0}
    >
      <span
        className={
          styles.tooltipTrigger
        }
        aria-label={text}
      >
        ?
      </span>

      <span
        className={
          styles.tooltipContent
        }
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}