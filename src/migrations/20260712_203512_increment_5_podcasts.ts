import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "podcast_shows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"cover_image_id" integer NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcast_episodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"show_id" integer NOT NULL,
  	"show_notes" jsonb,
  	"audio_id" integer NOT NULL,
  	"duration" numeric,
  	"published_at" timestamp(3) with time zone,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcast_audio" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"duration" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "podcast_shows_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "podcast_episodes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "podcast_audio_id" integer;
  ALTER TABLE "podcast_shows" ADD CONSTRAINT "podcast_shows_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_show_id_podcast_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."podcast_shows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_audio_id_podcast_audio_id_fk" FOREIGN KEY ("audio_id") REFERENCES "public"."podcast_audio"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "podcast_shows_cover_image_idx" ON "podcast_shows" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX "podcast_shows_slug_idx" ON "podcast_shows" USING btree ("slug");
  CREATE INDEX "podcast_shows_updated_at_idx" ON "podcast_shows" USING btree ("updated_at");
  CREATE INDEX "podcast_shows_created_at_idx" ON "podcast_shows" USING btree ("created_at");
  CREATE INDEX "podcast_episodes_show_idx" ON "podcast_episodes" USING btree ("show_id");
  CREATE INDEX "podcast_episodes_audio_idx" ON "podcast_episodes" USING btree ("audio_id");
  CREATE UNIQUE INDEX "podcast_episodes_slug_idx" ON "podcast_episodes" USING btree ("slug");
  CREATE INDEX "podcast_episodes_updated_at_idx" ON "podcast_episodes" USING btree ("updated_at");
  CREATE INDEX "podcast_episodes_created_at_idx" ON "podcast_episodes" USING btree ("created_at");
  CREATE INDEX "podcast_audio_updated_at_idx" ON "podcast_audio" USING btree ("updated_at");
  CREATE INDEX "podcast_audio_created_at_idx" ON "podcast_audio" USING btree ("created_at");
  CREATE UNIQUE INDEX "podcast_audio_filename_idx" ON "podcast_audio" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_shows_fk" FOREIGN KEY ("podcast_shows_id") REFERENCES "public"."podcast_shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_episodes_fk" FOREIGN KEY ("podcast_episodes_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_audio_fk" FOREIGN KEY ("podcast_audio_id") REFERENCES "public"."podcast_audio"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_podcast_shows_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_shows_id");
  CREATE INDEX "payload_locked_documents_rels_podcast_episodes_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_episodes_id");
  CREATE INDEX "payload_locked_documents_rels_podcast_audio_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_audio_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "podcast_shows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcast_episodes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcast_audio" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "podcast_shows" CASCADE;
  DROP TABLE "podcast_episodes" CASCADE;
  DROP TABLE "podcast_audio" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_podcast_shows_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_podcast_episodes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_podcast_audio_fk";
  
  DROP INDEX "payload_locked_documents_rels_podcast_shows_id_idx";
  DROP INDEX "payload_locked_documents_rels_podcast_episodes_id_idx";
  DROP INDEX "payload_locked_documents_rels_podcast_audio_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "podcast_shows_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "podcast_episodes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "podcast_audio_id";`)
}
