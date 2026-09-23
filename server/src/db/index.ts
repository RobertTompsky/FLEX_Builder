import { Database } from "bun:sqlite";
import path from "node:path";
import {
  Kysely,
} from "kysely";
import type { DB } from "./types";
import { BunSqliteDialect } from 'kysely-bun-sqlite'

const DB_FILE_NAME = process.env.DB_FILE_NAME ?? "db.sqlite";

const DB_PATH = path.resolve(
  import.meta.dir,
  "../../",
  DB_FILE_NAME,
);

export const nativeDb = new Database(DB_PATH);

const schemaPath = path.join(import.meta.dir, "schema.sql");

nativeDb.run(await Bun.file(schemaPath).text());

export const db = new Kysely<DB>({
  dialect: new BunSqliteDialect({
    database: nativeDb,
  }),
});