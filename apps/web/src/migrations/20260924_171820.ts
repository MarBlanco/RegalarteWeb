import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_addresses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"street" varchar,
  	"number" varchar,
  	"apartment" varchar,
  	"postal_code" varchar,
  	"locality" varchar,
  	"province" varchar,
  	"references" varchar
  );
  
  ALTER TABLE "users" ADD COLUMN "phone_alt" varchar;
  ALTER TABLE "users" ADD COLUMN "address_street" varchar;
  ALTER TABLE "users" ADD COLUMN "address_number" varchar;
  ALTER TABLE "users" ADD COLUMN "address_apartment" varchar;
  ALTER TABLE "users" ADD COLUMN "address_postal_code" varchar;
  ALTER TABLE "users" ADD COLUMN "address_locality" varchar;
  ALTER TABLE "users" ADD COLUMN "address_province" varchar;
  ALTER TABLE "users" ADD COLUMN "address_references" varchar;
  ALTER TABLE "users_addresses" ADD CONSTRAINT "users_addresses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_addresses_order_idx" ON "users_addresses" USING btree ("_order");
  CREATE INDEX "users_addresses_parent_id_idx" ON "users_addresses" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_addresses" CASCADE;
  ALTER TABLE "users" DROP COLUMN "phone_alt";
  ALTER TABLE "users" DROP COLUMN "address_street";
  ALTER TABLE "users" DROP COLUMN "address_number";
  ALTER TABLE "users" DROP COLUMN "address_apartment";
  ALTER TABLE "users" DROP COLUMN "address_postal_code";
  ALTER TABLE "users" DROP COLUMN "address_locality";
  ALTER TABLE "users" DROP COLUMN "address_province";
  ALTER TABLE "users" DROP COLUMN "address_references";`)
}
