import { SERVER_DIR } from '../../shared/data'
import path from 'path'

export * from './workspace'

export const AGENT_WORKSPACES_DIR = path.join(
  SERVER_DIR,
  "data",
  "workspaces",
)