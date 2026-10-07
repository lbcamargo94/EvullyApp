import type { Kysely } from 'kysely';

// Baseline migration: establishes the migration history. Feature tables
// (profiles, projects, weights…) arrive in their own migrations.
export async function up(_db: Kysely<unknown>): Promise<void> {}

export async function down(_db: Kysely<unknown>): Promise<void> {}
