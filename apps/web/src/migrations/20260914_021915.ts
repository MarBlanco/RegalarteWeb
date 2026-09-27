import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_content_hero_slides_category" AS ENUM('velas', 'aromas', 'wax-melts', 'quemadores', 'packs', 'regalarte');
  CREATE TYPE "public"."enum_home_content_benefits_icon" AS ENUM('shipping', 'packaging', 'payment', 'leaf', 'support');
  CREATE TYPE "public"."enum_home_content_sections_category_slug" AS ENUM('velas', 'aromas', 'wax-melts', 'quemadores', 'packs', 'regalarte');
  CREATE TABLE "home_content_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"cta_text" varchar,
  	"category" "enum_home_content_hero_slides_category" NOT NULL
  );
  
  CREATE TABLE "home_content_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_content_benefits_icon" NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "home_content_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_slug" "enum_home_content_sections_category_slug" NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "home_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_title" varchar,
  	"intro_description" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "home_content_hero_slides" ADD CONSTRAINT "home_content_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_benefits" ADD CONSTRAINT "home_content_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_sections" ADD CONSTRAINT "home_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_content_hero_slides_order_idx" ON "home_content_hero_slides" USING btree ("_order");
  CREATE INDEX "home_content_hero_slides_parent_id_idx" ON "home_content_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "home_content_benefits_order_idx" ON "home_content_benefits" USING btree ("_order");
  CREATE INDEX "home_content_benefits_parent_id_idx" ON "home_content_benefits" USING btree ("_parent_id");
  CREATE INDEX "home_content_sections_order_idx" ON "home_content_sections" USING btree ("_order");
  CREATE INDEX "home_content_sections_parent_id_idx" ON "home_content_sections" USING btree ("_parent_id");
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "product_images" DROP COLUMN "prefix";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_content_hero_slides" CASCADE;
  DROP TABLE "home_content_benefits" CASCADE;
  DROP TABLE "home_content_sections" CASCADE;
  DROP TABLE "home_content" CASCADE;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT 'media';
  ALTER TABLE "product_images" ADD COLUMN "prefix" varchar DEFAULT 'product-images';
  DROP TYPE "public"."enum_home_content_hero_slides_category";
  DROP TYPE "public"."enum_home_content_benefits_icon";
  DROP TYPE "public"."enum_home_content_sections_category_slug";`)
}
