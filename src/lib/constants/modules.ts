/**
 * Confirmed product modules (19). Phase 1: navigation stubs only.
 */
export const PRODUCT_MODULES = [
  { id: "dashboard", label: "Dashboard", href: "/", phase: 1 },
  {
    id: "machines",
    label: "Machinery & equipment",
    href: "/machines",
    phase: 3,
  },
  {
    id: "specifications",
    label: "Specifications & documents",
    href: "/machines",
    phase: 3,
  },
  {
    id: "compliance",
    label: "Compliance",
    href: "/compliance",
    phase: 4,
  },
  {
    id: "customers",
    label: "Customers & contacts",
    href: "/customers",
    phase: 5,
  },
  {
    id: "branches",
    label: "Branches, sites & locations",
    href: "/branches",
    phase: 5,
  },
  {
    id: "hire-agreements",
    label: "Hire agreements",
    href: "/hire-agreements",
    phase: 5,
  },
  {
    id: "hiring-history",
    label: "Hiring history",
    href: "/hiring-history",
    phase: 5,
  },
  {
    id: "readings",
    label: "Readings & operating hours",
    href: "/readings",
    phase: 6,
  },
  { id: "fuel", label: "Fuel management", href: "/fuel", phase: 6 },
  { id: "tyres", label: "Tyre management", href: "/tyres", phase: 6 },
  {
    id: "spare-parts",
    label: "Spare parts",
    href: "/spare-parts",
    phase: 6,
  },
  {
    id: "maintenance",
    label: "Maintenance & servicing",
    href: "/maintenance",
    phase: 7,
  },
  {
    id: "breakdowns",
    label: "Breakdowns & repairs",
    href: "/breakdowns",
    phase: 7,
  },
  {
    id: "notifications",
    label: "Notifications & alerts",
    href: "/notifications",
    phase: 8,
  },
  {
    id: "reports",
    label: "Reports & analytics",
    href: "/reports",
    phase: 8,
  },
  {
    id: "users",
    label: "Users, roles & permissions",
    href: "/users",
    phase: 2,
  },
  {
    id: "audit",
    label: "Audit history",
    href: "/audit",
    phase: 8,
  },
  {
    id: "settings",
    label: "System settings",
    href: "/settings",
    phase: 2,
  },
] as const;

/** Confirmed machine detail section nav (stubs in Phase 1). */
export const MACHINE_DETAIL_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "specifications", label: "Specifications" },
  { id: "compliance", label: "Compliance" },
  { id: "hiring-history", label: "Hiring History" },
  { id: "readings", label: "Readings" },
  { id: "fuel", label: "Fuel" },
  { id: "tyres", label: "Tyres" },
  { id: "spare-parts", label: "Spare Parts" },
  { id: "maintenance", label: "Maintenance" },
  { id: "documents", label: "Documents" },
  { id: "audit-history", label: "Audit History" },
] as const;

/** Primary sidebar items shown in Phase 1 shell. */
export const SHELL_NAV = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "machines", label: "Machines", href: "/machines" },
  { id: "customers", label: "Customers", href: "/customers" },
  { id: "hire-agreements", label: "Hire agreements", href: "/hire-agreements" },
  { id: "compliance", label: "Compliance", href: "/compliance" },
  { id: "maintenance", label: "Maintenance", href: "/maintenance" },
  { id: "reports", label: "Reports", href: "/reports" },
  { id: "settings", label: "Settings", href: "/settings" },
] as const;
