import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"percent" numeric NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"instagram_url" varchar,
  	"tiktok_url" varchar,
  	"facebook_url" varchar,
  	"whatsapp_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ayuda_content_sections_body" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "ayuda_content_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_id" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"intro" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar
  );
  
  CREATE TABLE "ayuda_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "coupons_id" integer;
  ALTER TABLE "commerce_settings" ADD COLUMN "free_shipping_threshold" numeric DEFAULT 105000 NOT NULL;
  ALTER TABLE "ayuda_content_sections_body" ADD CONSTRAINT "ayuda_content_sections_body_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ayuda_content_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ayuda_content_sections" ADD CONSTRAINT "ayuda_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ayuda_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX "ayuda_content_sections_body_order_idx" ON "ayuda_content_sections_body" USING btree ("_order");
  CREATE INDEX "ayuda_content_sections_body_parent_id_idx" ON "ayuda_content_sections_body" USING btree ("_parent_id");
  CREATE INDEX "ayuda_content_sections_order_idx" ON "ayuda_content_sections" USING btree ("_order");
  CREATE INDEX "ayuda_content_sections_parent_id_idx" ON "ayuda_content_sections" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");`)

  // Datos: el único cupón que estaba hardcodeado en lib/orders/coupons.ts
  // (REGALARTE10, 10 %) pasa a ser un registro editable. Idempotente.
  await db.execute(sql`
   INSERT INTO "coupons" ("code", "percent", "active")
   VALUES ('REGALARTE10', 10, true)
   ON CONFLICT ("code") DO NOTHING;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "coupons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ayuda_content_sections_body" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ayuda_content_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ayuda_content" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "ayuda_content_sections_body" CASCADE;
  DROP TABLE "ayuda_content_sections" CASCADE;
  DROP TABLE "ayuda_content" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_coupons_fk";
  
  DROP INDEX "payload_locked_documents_rels_coupons_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "coupons_id";
  ALTER TABLE "commerce_settings" DROP COLUMN "free_shipping_threshold";`)
}
