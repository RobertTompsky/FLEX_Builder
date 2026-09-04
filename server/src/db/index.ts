// import {
//   Database,
// } from "bun:sqlite";

// import path from "path";
// import {
//   fileURLToPath,
// } from "url";
// import { Kysely } from "kysely";

// const __filename =
//   fileURLToPath(import.meta.url);

// const __dirname =
//   path.dirname(__filename);

// const DB_FILE_NAME =
//   process.env.DB_FILE_NAME ??
//   "db.sqlite";

// const DB_PATH =
//   path.resolve(
//     __dirname,
//     "../../",
//     DB_FILE_NAME,
//   );

// export const db = new Database(DB_PATH);

// db.run(`
//     PRAGMA foreign_keys = ON;
// `);

// const schemaPath =
//   path.join(
//     import.meta.dir,
//     "schema.sql",
//   );

// db.run(
//   await Bun.file(
//     schemaPath,
//   ).text(),
// );

import { Database } from "bun:sqlite";
import path from "node:path";
import {
  Kysely,
} from "kysely";
import type { DB } from "./types";
import { BunSqliteDialect } from 'kysely-bun-sqlite'

const DB_FILE_NAME =
  process.env.DB_FILE_NAME ?? "db.sqlite";

const DB_PATH = path.resolve(
  import.meta.dir,
  "../../",
  DB_FILE_NAME,
);

export const nativeDb =
  new Database(DB_PATH);

const schemaPath = path.join(
  import.meta.dir,
  "schema.sql",
);

nativeDb.run(
  await Bun.file(schemaPath).text(),
);

export const db =
  new Kysely<DB>({
    dialect: new BunSqliteDialect({
      database: nativeDb,
    }),
  });