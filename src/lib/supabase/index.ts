export {
  getSupabasePublicEnv,
  getSupabaseServerEnv,
  isSupabaseConfigured,
} from "./env";
export { getSupabaseBrowserClient } from "./client";
export { createSupabaseServerClient } from "./server";
// Note: createSupabaseAdminClient is intentionally NOT re-exported from this barrel
// to reduce accidental client-bundle imports. Import from './admin' on the server only.
