import { z } from "zod";
import { CapabilityAccessSchema, AgentCapabilityConfigSchema, CodeGenSchema } from './cababilities.schemas'

export type CodeGenInput = z.infer<typeof CodeGenSchema>

export type CapabilityAccess = z.infer<typeof CapabilityAccessSchema>
export type AgentCapabilityConfig = z.infer<typeof AgentCapabilityConfigSchema>