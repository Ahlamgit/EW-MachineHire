"use client";

import { ActionForm } from "@/components/shared/action-form";
import {
  Field,
  inputClassName,
  selectClassName,
  textareaClassName,
} from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  activateHire,
  closeHire,
  createHireAgreement,
} from "@/features/hires/actions";
import type { HireAgreementRow } from "@/types";

export function CreateHireForm({
  machines,
  customers,
  sites,
}: {
  machines: Array<{ id: string; code: string; name: string }>;
  customers: Array<{ id: string; code: string; name: string }>;
  sites: Array<{ id: string; customer_id: string; name: string }>;
}) {
  return (
    <ActionForm action={createHireAgreement} className="grid gap-3 sm:grid-cols-2">
      <Field label="Machine">
        <select className={selectClassName} name="machine_id" required>
          <option value="">Select</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} — {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Customer">
        <select className={selectClassName} name="customer_id" required>
          <option value="">Select</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Site (optional)">
        <select className={selectClassName} name="site_id" defaultValue="">
          <option value="">—</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Duration type">
        <select className={selectClassName} name="duration_type" required>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="months">Months</option>
          <option value="open_ended">Open-ended</option>
        </select>
      </Field>
      <Field label="Planned duration value">
        <input
          className={inputClassName}
          name="planned_duration_value"
          type="number"
          min="0"
          step="any"
          placeholder="Leave empty for open-ended"
        />
      </Field>
      <Field label="Activate now?">
        <select className={selectClassName} name="activate_now" defaultValue="false">
          <option value="false">Save as draft</option>
          <option value="true">Activate immediately</option>
        </select>
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea className={textareaClassName} name="notes" />
      </Field>
      <div className="sm:col-span-2 space-y-2">
        <Button type="submit">Create hire</Button>
        <p className="text-xs text-[var(--ew-muted)]">
          No billing fields — pricing rules are Open. Activation is blocked by
          DB if compliance is not all green, machine is on hire, or fixing is
          open. Duration end does not auto-close.
        </p>
      </div>
    </ActionForm>
  );
}

export function ActivateHireForm({ hires }: { hires: HireAgreementRow[] }) {
  const drafts = hires.filter((h) => h.status === "draft");
  if (!drafts.length) {
    return <p className="text-sm text-[var(--ew-muted)]">No draft hires.</p>;
  }
  return (
    <ActionForm action={activateHire} className="grid gap-3">
      <Field label="Draft hire">
        <select className={selectClassName} name="hire_id" required>
          {drafts.map((h) => (
            <option key={h.id} value={h.id}>
              {h.machines?.code ?? h.machine_id} ·{" "}
              {h.customers?.name ?? h.customer_id}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit">Activate hire</Button>
    </ActionForm>
  );
}

export function CloseHireForm({ hires }: { hires: HireAgreementRow[] }) {
  const active = hires.filter((h) => h.status === "active");
  if (!active.length) {
    return <p className="text-sm text-[var(--ew-muted)]">No active hires.</p>;
  }
  return (
    <ActionForm action={closeHire} className="grid gap-3">
      <Field label="Active hire">
        <select className={selectClassName} name="hire_id" required>
          {active.map((h) => (
            <option key={h.id} value={h.id}>
              {h.machines?.code ?? h.machine_id} ·{" "}
              {h.customers?.name ?? h.customer_id}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Close note">
        <textarea className={textareaClassName} name="detail" />
      </Field>
      <Button type="submit" variant="secondary">
        Close hire explicitly
      </Button>
    </ActionForm>
  );
}
