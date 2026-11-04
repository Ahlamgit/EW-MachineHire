export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string };

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function mapSupabaseError(error: {
  message?: string;
  code?: string;
}): string {
  const msg = error.message ?? "Database error";
  if (msg.includes("hire_activation_blocked")) {
    return msg.replace(/^.*hire_activation_blocked:\s*/i, "Hire blocked: ");
  }
  if (msg.includes("closed_hire_is_terminal")) {
    return "Closed hires cannot be reopened.";
  }
  if (msg.includes("duplicate key") && msg.includes("hire_agreements_one_active")) {
    return "Another active hire already exists for this machine.";
  }
  if (msg.includes("append-only")) {
    return "History records cannot be edited or deleted; add a new record instead.";
  }
  return msg;
}
