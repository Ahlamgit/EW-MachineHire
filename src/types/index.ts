/** Shared domain types — expand as Confirmed schemas land. */

export type MachineStatus =
  | "available"
  | "on_hire"
  | "in_repair"
  | "unavailable";

export type ComplianceBand = "green" | "yellow" | "red" | "missing";

export type UiTone = "blue" | "green" | "yellow" | "black";
