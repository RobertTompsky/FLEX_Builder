import type {
  Run,
  RunStatus,
} from "@flex-builder/shared/run";

import { db } from "../index";

function mapRun(row: {
  id: string;
  chat_id: string;
  status: RunStatus;
  started_at: number;
  finished_at: number | null;
}): Run {
  return {
    id: row.id,
    status: row.status,
    startedAt: new Date(
      row.started_at,
    ).toISOString(),
    finishedAt:
      row.finished_at === null
        ? null
        : new Date(
            row.finished_at,
          ).toISOString(),
  };
}

export async function createRun(
  id: string,
  chatId: string,
): Promise<Run> {
  await db
    .insertInto("runs")
    .values({
      id,
      chat_id: chatId,
      status: "running",
      finished_at: null,
    })
    .execute();

  return (await getRun(id))!;
}

export async function getRun(
  runId: string,
): Promise<Run | undefined> {
  const row = await db
    .selectFrom("runs")
    .select([
      "id",
      "chat_id",
      "status",
      "started_at",
      "finished_at",
    ])
    .where(
      "id",
      "=",
      runId,
    )
    .executeTakeFirst();

  return row
    ? mapRun(row)
    : undefined;
}

export async function listRunsByChatId(
  chatId: string,
): Promise<Run[]> {
  const rows = await db
    .selectFrom("runs")
    .select([
      "id",
      "chat_id",
      "status",
      "started_at",
      "finished_at",
    ])
    .where(
      "chat_id",
      "=",
      chatId,
    )
    .orderBy(
      "started_at",
      "desc",
    )
    .execute();

  return rows.map(
    mapRun,
  );
}

export async function updateRunStatus(
  runId: string,
  status: RunStatus,
): Promise<boolean> {
  const result = await db
    .updateTable("runs")
    .set({
      status,
      finished_at:
        status === "running"
          ? null
          : Date.now(),
    })
    .where(
      "id",
      "=",
      runId,
    )
    .executeTakeFirst();

  return result.numUpdatedRows > 0n;
}

export async function deleteRun(
  runId: string,
): Promise<boolean> {
  const result = await db
    .deleteFrom("runs")
    .where(
      "id",
      "=",
      runId,
    )
    .executeTakeFirst();

  return result.numDeletedRows > 0n;
}