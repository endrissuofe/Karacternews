import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "podcast_episodes" ADD COLUMN "youtube_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "youtube_channel_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "youtube_live_stream_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "podcast_episodes" DROP COLUMN "youtube_url";
  ALTER TABLE "site_settings" DROP COLUMN "youtube_channel_url";
  ALTER TABLE "site_settings" DROP COLUMN "youtube_live_stream_url";`)
}
