import * as fs from "fs";
import * as path from "path";

const src = path.resolve("data/prod.db");
if (!fs.existsSync(src)) {
  console.error("X data/prod.db not found - nothing to back up.");
  process.exit(1);
}

const backupsDir = path.resolve("data/backups");
fs.mkdirSync(backupsDir, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const dest = path.join(backupsDir, `prod-${ts}.db`);
fs.copyFileSync(src, dest);
console.log(`Complete. Backed up prod.db - ${dest}`);
