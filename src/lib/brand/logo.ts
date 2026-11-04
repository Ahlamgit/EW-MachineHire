import { existsSync } from "node:fs";
import path from "node:path";

/** Server-only: true when the official logo file has been placed. */
export function isOfficialLogoPresent(): boolean {
  return existsSync(
    path.join(process.cwd(), "public/brand/ew-machine-hire-logo.jpg"),
  );
}
