/**
 * DEMO sample data for Phase 1 shell only.
 * Clearly labeled — never treat as real customer/machine records.
 */
export const DEMO_BANNER =
  "DEMO data — sample figures for UI layout only. Not real machines, customers, or hires.";

export const DEMO_DASHBOARD_CARDS = [
  {
    id: "fleet",
    title: "Fleet size",
    value: "24",
    hint: "DEMO machines",
    tone: "blue" as const,
  },
  {
    id: "on-hire",
    title: "On hire",
    value: "11",
    hint: "DEMO active hires",
    tone: "green" as const,
  },
  {
    id: "available",
    title: "Available",
    value: "9",
    hint: "DEMO available",
    tone: "yellow" as const,
  },
  {
    id: "compliance-risk",
    title: "Compliance attention",
    value: "4",
    hint: "DEMO yellow/red/missing",
    tone: "black" as const,
  },
] as const;

export const DEMO_MACHINES = [
  {
    id: "demo-machine-001",
    code: "EXC-DEMO-01",
    name: "DEMO Excavator JCB",
    type: "Excavator",
    status: "Available",
    branch: "DEMO Ndola Yard",
  },
  {
    id: "demo-machine-002",
    code: "LDR-DEMO-02",
    name: "DEMO Front End Loader",
    type: "Loader",
    status: "On hire",
    branch: "DEMO Ndola Yard",
  },
  {
    id: "demo-machine-003",
    code: "ROL-DEMO-03",
    name: "DEMO Roller Compactor",
    type: "Roller",
    status: "In repair",
    branch: "DEMO Workshop",
  },
] as const;
