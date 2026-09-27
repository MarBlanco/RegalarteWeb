import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_product_tags_kind" AS ENUM('aroma', 'ritual', 'general');
   ALTER TABLE "product_tags" ADD COLUMN "kind" "enum_product_tags_kind" DEFAULT 'general' NOT NULL;`)
  // Opciones iniciales de filtro: los 2 tags reales existentes son aromas,
  // y se siembran exactamente 2 rituales (sin datos de prueba extra).
  await db.execute(sql`
   UPDATE "product_tags" SET "kind" = 'aroma' WHERE "slug" IN ('vainilla-nota', 'ambar-nota');
   INSERT INTO "product_tags" ("name", "slug", "kind", "active")
   VALUES ('Relajación', 'relajacion', 'ritual', true), ('Energía', 'energia', 'ritual', true)
   ON CONFLICT ("slug") DO NOTHING;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "product_tags" WHERE "slug" IN ('relajacion', 'energia');
   ALTER TABLE "product_tags" DROP COLUMN "kind";
   DROP TYPE "public"."enum_product_tags_kind";`)
}
