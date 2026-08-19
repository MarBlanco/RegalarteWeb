import { execSync } from "node:child_process";

const hasDbEnv = Boolean(process.env.DATABASE_URI && process.env.PAYLOAD_SECRET);

if (!hasDbEnv) {
  console.log("[migrate-on-build] skip: DATABASE_URI/PAYLOAD_SECRET not present in this build");
  process.exit(0);
}

console.log("[migrate-on-build] applying pending migrations...");
try {
  execSync("npm run migrate", { stdio: "inherit" });
  console.log("[migrate-on-build] done");
} catch (err) {
  console.error("[migrate-on-build] migration failed:", err.message);
  process.exit(1);
}