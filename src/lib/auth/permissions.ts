/**
 * Proposed permission keys — keep in sync with docs/PERMISSIONS.md and the Phase 2 migration seed.
 */
export const PERMISSIONS = [
  "dashboard:read",
  "machines:read",
  "machines:write",
  "customers:read",
  "customers:write",
  "hires:read",
  "hires:write",
  "hires:close",
  "compliance:read",
  "compliance:write",
  "maintenance:read",
  "maintenance:write",
  "ops_logs:read",
  "ops_logs:write",
  "reports:read",
  "notifications:read",
  "audit:read",
  "users:manage",
  "settings:manage",
  "finance:read",
  "finance:write",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const PROPOSED_ROLES = [
  "admin",
  "operations",
  "workshop",
  "compliance",
  "viewer",
] as const;

export type RoleKey = (typeof PROPOSED_ROLES)[number];
