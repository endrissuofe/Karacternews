import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// This is the Increment 1 baseline migration. Payload generated this file
// by diffing the config against an empty migration history, so its
// original `up`/`down` bodies contained full CREATE/DROP statements for
// every table — but the schema already exists in the database (it was
// built via Payload's dev-mode push while we were actively reshaping
// collections this increment). Running those statements as-is would fail
// with "already exists" errors.
//
// Per Payload's documented push-to-migrations transition, this baseline
// is intentionally a no-op: it exists only to record a checkpoint in
// `payload_migrations` so migration history matches reality. From here
// on, schema changes must go through new, reviewed migrations — see
// README.md "Database migrations".
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Intentionally empty — see comment above.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Intentionally empty — this baseline is a checkpoint, not a real
  // schema change, so there's nothing meaningful to roll back.
}
