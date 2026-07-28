import path from 'path'
import fs from 'fs-extra'

export function getAgentWorkspacePaths(
  agentsDir: string,
  agentId: string,
) {
  const safeAgentId = path.basename(agentId);

  if (safeAgentId !== agentId) {
    throw new Error("Invalid agent id");
  }

  const root = path.join(agentsDir, safeAgentId);

  return {
    root,
    identity: path.join(root, "agent.json"),
    checkpoint: path.join(root, "checkpoint.json"),
    artifacts: path.join(root, "artifacts",),
    subagents: path.join(root, "subagents",),
    // files: path.join(root, "files.json")
  };
}

export async function createAgentWorkspace(
  agentsDir: string,
  agentId: string,
) {
  const paths = getAgentWorkspacePaths(
    agentsDir,
    agentId,
  );

  await Promise.all([
    // fs.ensureDir(paths.root),
    fs.ensureDir(paths.artifacts),
    fs.ensureDir(paths.subagents),
  ]);

  // await fs.writeJson(
  //   paths.files,
  //   [],
  //   { spaces: 2 },
  // );

  return paths;
}