import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Tipos reales del catálogo (S1-03).
 *
 * Siembra las categorías hijas (tipos) desde el contenido editorial
 * aprobado del storefront y vincula los productos a su tipo cuando se
 * deriva con certeza del slug/título. Los ambiguos quedan en la padre
 * (el listado agrega hijas, así que nada se pierde).
 *
 * - Idempotente en seed: ON CONFLICT (slug) DO NOTHING.
 * - No toca usuarios, órdenes, medios ni flags active.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Vela Clásica', 'vela-clasica', 'Aromas atemporales que iluminan tus espacios con calidez y armonía.', "id", 0, false, true FROM "categories" WHERE "slug" = 'velas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Vela Bubble', 'vela-bubble', 'Formas escultóricas que decoran y perfuman con estilo propio.', "id", 1, false, true FROM "categories" WHERE "slug" = 'velas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Vela en Lata', 'vela-en-lata', 'Compañeras ideales para llevar tu ritual donde vayas.', "id", 2, false, true FROM "categories" WHERE "slug" = 'velas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Vela de Soja', 'vela-de-soja', 'Cera vegetal de soja para una combustión limpia y duradera.', "id", 3, false, true FROM "categories" WHERE "slug" = 'velas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Sets & Regalos', 'sets-regalos', 'Combinaciones pensadas para regalar y compartir.', "id", 4, false, true FROM "categories" WHERE "slug" = 'velas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Difusores', 'difusores', 'Fragancia constante que acompaña tus espacios todo el día.', "id", 0, false, true FROM "categories" WHERE "slug" = 'aromas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Home Sprays', 'home-sprays', 'Un gesto simple para renovar el aire de tu hogar.', "id", 1, false, true FROM "categories" WHERE "slug" = 'aromas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Brumas Textiles', 'brumas-textiles', 'Cortinas, ropa de cama y sillones con tu aroma favorito.', "id", 2, false, true FROM "categories" WHERE "slug" = 'aromas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Aceites', 'aceites', 'Concentrados intensos para hornillos y difusores.', "id", 3, false, true FROM "categories" WHERE "slug" = 'aromas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Sets Aromáticos', 'sets-aromaticos', 'Rituales completos en una sola caja.', "id", 4, false, true FROM "categories" WHERE "slug" = 'aromas'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Clásicos', 'melts-clasicos', 'Los aromas esenciales que nunca fallan.', "id", 0, false, true FROM "categories" WHERE "slug" = 'wax-melts'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Florales', 'melts-florales', 'Bouquets delicados para un hogar en flor.', "id", 1, false, true FROM "categories" WHERE "slug" = 'wax-melts'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Frutales', 'melts-frutales', 'Chispa frutal para levantar cualquier ambiente.', "id", 2, false, true FROM "categories" WHERE "slug" = 'wax-melts'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Gourmand', 'melts-gourmand', 'Vainilla, caramelo y todo lo acogedor.', "id", 3, false, true FROM "categories" WHERE "slug" = 'wax-melts'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Sets', 'melts-sets', 'Degustaciones perfectas para obsequiar.', "id", 4, false, true FROM "categories" WHERE "slug" = 'wax-melts'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Cerámica', 'quemador-ceramica', 'Piezas de cerámica hechas con calidez artesanal.', "id", 0, false, true FROM "categories" WHERE "slug" = 'quemadores'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Vidrio', 'quemador-vidrio', 'Transparencia y luz para tus wax melts.', "id", 1, false, true FROM "categories" WHERE "slug" = 'quemadores'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Metal', 'quemador-metal', 'Líneas contemporáneas con carácter.', "id", 2, false, true FROM "categories" WHERE "slug" = 'quemadores'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Eléctricos', 'quemador-electrico', 'Aroma seguro sin fuego, ideal para cada rincón.', "id", 3, false, true FROM "categories" WHERE "slug" = 'quemadores'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Sets', 'quemador-sets', 'Quemador más melts: el ritual completo.', "id", 4, false, true FROM "categories" WHERE "slug" = 'quemadores'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Pack Relax', 'pack-relax', 'Todo lo necesario para bajar el ritmo.', "id", 0, false, true FROM "categories" WHERE "slug" = 'packs'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Pack Home', 'pack-home', 'Transformá cada ambiente con un solo gesto.', "id", 1, false, true FROM "categories" WHERE "slug" = 'packs'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Pack Completo', 'pack-completo', 'Velas, aromas y detalles en una caja única.', "id", 2, false, true FROM "categories" WHERE "slug" = 'packs'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Pack Regalo', 'pack-regalo', 'Presentación premium, sin vueltas.', "id", 3, false, true FROM "categories" WHERE "slug" = 'packs'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Packs Dúo', 'pack-duo', 'El doble de ritual, para vos y alguien más.', "id", 4, false, true FROM "categories" WHERE "slug" = 'packs'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Cajas', 'cajas-regalo', 'Cajas que emocionan antes de abrirse.', "id", 0, false, true FROM "categories" WHERE "slug" = 'regalarte'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Tarjetas', 'tarjetas', 'Palabras que acompañan cada regalo.', "id", 1, false, true FROM "categories" WHERE "slug" = 'regalarte'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Envoltorios', 'envoltorios', 'Detalles que elevan cualquier presente.', "id", 2, false, true FROM "categories" WHERE "slug" = 'regalarte'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Bolsas', 'bolsas', 'Prácticas y lindas para entregar en mano.', "id", 3, false, true FROM "categories" WHERE "slug" = 'regalarte'
   ON CONFLICT ("slug") DO NOTHING;
   INSERT INTO "categories" ("title", "slug", "description", "parent_id", "sort_order", "featured", "active")
   SELECT 'Sets', 'sets-regalo', 'Regalos completos, cero estrés.', "id", 4, false, true FROM "categories" WHERE "slug" = 'regalarte'
   ON CONFLICT ("slug") DO NOTHING;`)
  await db.execute(sql`
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'vela-clasica') WHERE "slug" IN ('velas-vela-clasica-1', 'velas-vela-clasica-3', 'velas-vela-clasica-4', 'vela-clasica-cacao-caramelo');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'difusores') WHERE "slug" IN ('aromas-difusores-1', 'aromas-difusores-2', 'aromas-difusores-3', 'aromas-difusores-4', 'difusor-premium-001');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'melts-clasicos') WHERE "slug" IN ('wax-melts-melts-clasicos-1', 'wax-melts-melts-clasicos-2', 'wax-melts-melts-clasicos-3', 'wax-melts-melts-clasicos-4');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'quemador-ceramica') WHERE "slug" IN ('quemadores-quemador-ceramica-1', 'quemadores-quemador-ceramica-2', 'quemadores-quemador-ceramica-3', 'quemadores-quemador-ceramica-4');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'pack-relax') WHERE "slug" IN ('packs-pack-relax-1', 'packs-pack-relax-2', 'packs-pack-relax-3', 'packs-pack-relax-4');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'cajas-regalo') WHERE "slug" IN ('regalarte-cajas-regalo-1', 'regalarte-cajas-regalo-2', 'regalarte-cajas-regalo-3', 'regalarte-cajas-regalo-4');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'velas') WHERE "slug" IN ('velas-vela-clasica-1', 'velas-vela-clasica-3', 'velas-vela-clasica-4', 'vela-clasica-cacao-caramelo');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'aromas') WHERE "slug" IN ('aromas-difusores-1', 'aromas-difusores-2', 'aromas-difusores-3', 'aromas-difusores-4', 'difusor-premium-001');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'wax-melts') WHERE "slug" IN ('wax-melts-melts-clasicos-1', 'wax-melts-melts-clasicos-2', 'wax-melts-melts-clasicos-3', 'wax-melts-melts-clasicos-4');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'quemadores') WHERE "slug" IN ('quemadores-quemador-ceramica-1', 'quemadores-quemador-ceramica-2', 'quemadores-quemador-ceramica-3', 'quemadores-quemador-ceramica-4');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'packs') WHERE "slug" IN ('packs-pack-relax-1', 'packs-pack-relax-2', 'packs-pack-relax-3', 'packs-pack-relax-4');
   UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'regalarte') WHERE "slug" IN ('regalarte-cajas-regalo-1', 'regalarte-cajas-regalo-2', 'regalarte-cajas-regalo-3', 'regalarte-cajas-regalo-4');`)
  await db.execute(sql`
   DELETE FROM "categories" WHERE "slug" IN ('vela-clasica', 'vela-bubble', 'vela-en-lata', 'vela-de-soja', 'sets-regalos', 'difusores', 'home-sprays', 'brumas-textiles', 'aceites', 'sets-aromaticos', 'melts-clasicos', 'melts-florales', 'melts-frutales', 'melts-gourmand', 'melts-sets', 'quemador-ceramica', 'quemador-vidrio', 'quemador-metal', 'quemador-electrico', 'quemador-sets', 'pack-relax', 'pack-home', 'pack-completo', 'pack-regalo', 'pack-duo', 'cajas-regalo', 'tarjetas', 'envoltorios', 'bolsas', 'sets-regalo');`)
}
