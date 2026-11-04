"use client";

import { ActionForm } from "@/components/shared/action-form";
import {
  Field,
  selectClassName,
  textareaClassName,
} from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  completeFixingJob,
  openFixingJob,
} from "@/features/maintenance/actions";
import type { FixingJobRow } from "@/types";

export function OpenFixingForm({
  machineId,
  machines,
}: {
  machineId?: string;
  machines?: Array<{ id: string; code: string; name: string }>;
}) {
  return (
    <ActionForm action={openFixingJob} className="grid gap-3">
      {machineId ? (
        <input type="hidden" name="machine_id" value={machineId} />
      ) : (
        <Field label="Machine">
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
      <Field label="Job kind">
        <select className={selectClassName} name="job_kind" required>
          <option value="service">Service</option>
          <option value="breakdown">Breakdown</option>
          <option value="repair">Repair</option>
        </select>
      </Field>
      <Field label="Notes">
        <textarea className={textareaClassName} name="notes" />
      </Field>
      <Button type="submit">Open fixing job</Button>
    </ActionForm>
  );
}

export function CompleteFixingForm({ jobs }: { jobs: FixingJobRow[] }) {
  if (!jobs.length) {
    return (
      <p className="text-sm text-[var(--ew-muted)]">No open jobs to complete.</p>
    );
  }
  return (
    <ActionForm action={completeFixingJob} className="grid gap-3">
      <Field label="Open job">
        <select className={selectClassName} name="job_id" required>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.job_kind} · opened {new Date(j.opened_at).toLocaleString()}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" variant="secondary">
        Complete job
      </Button>
    </ActionForm>
  );
}
