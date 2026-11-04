"use client";

import { ActionForm } from "@/components/shared/action-form";
import {
  Field,
  inputClassName,
  selectClassName,
  textareaClassName,
} from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { renewComplianceDocument } from "@/features/compliance/actions";
import { COMPLIANCE_DOCUMENT_LABELS } from "@/lib/compliance/bands";

export function RenewComplianceForm({
  machineId,
  machines,
}: {
  machineId?: string;
  machines?: Array<{ id: string; code: string; name: string }>;
}) {
  return (
    <ActionForm action={renewComplianceDocument} className="grid gap-3 sm:grid-cols-2">
      {machineId ? (
        <input type="hidden" name="machine_id" value={machineId} />
      ) : (
        <Field label="Machine" className="sm:col-span-2">
          <select className={selectClassName} name="machine_id" required>
            <option value="">Select machine</option>
            {(machines ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Document type">
        <select className={selectClassName} name="document_type" required>
          {Object.entries(COMPLIANCE_DOCUMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Document Date (actual)">
        <input
          className={inputClassName}
          type="date"
          name="document_date"
          required
        />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea className={textareaClassName} name="notes" />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit">Add / renew record</Button>
        <p className="mt-2 text-xs text-[var(--ew-muted)]">
          Prior records are preserved. Status uses Document Date, not entry
          time: green &lt;9mo, yellow 9–&lt;10, red ≥10mo.
        </p>
      </div>
    </ActionForm>
  );
}
