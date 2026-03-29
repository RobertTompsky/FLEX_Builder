# Agent Builder

Use this module to create and run sub-agents for task execution.

A sub-agent is useful when a task should be delegated into an isolated run with its own:
- input messages
- model
- allowed skills

The sub-agent can read and import only the skills you explicitly allow.

## Purpose

Create agents that perform tasks using a restricted set of skills.

Use this module when you need to:
- delegate a task to another agent
- limit which skills that agent can use
- provide that agent with specific input messages
- run a focused agent with a clean context

## Exports

### `callAgent(config: PublicAgentConfig)`

Runs an agent with the provided configuration.

### `allowedSkills`

Array of available skill objects that may be passed to the `available` field.

Before selecting skills for a sub-agent, **use `console.log(allowedSkills)`** to inspect which specific skills are available.

Only include skills that exist in `allowedSkills` and are needed to complete the task.

## Input contract

The input **must strictly match** the `PublicAgentConfig` interface defined in the `callAgent.ts` file.  
**Must** read this file before filling the input object.

Do not add extra fields.  
Do not use unsupported values.

