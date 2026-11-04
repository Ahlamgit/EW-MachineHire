"use client";

import { ActionForm } from "@/components/shared/action-form";
import {
  Field,
  inputClassName,
  selectClassName,
  textareaClassName,
} from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { createMachine, updateMachine } from "@/features/machines/actions";
import type { MachineRow } from "@/types";

type RefItem = { id: string; label?: string; name?: string; key?: string; code?: string };

export function MachineForm({
  mode,
  machine,
  types,
  brands,
  branches,
}: {
  mode: "create" | "edit";
  machine?: MachineRow;
  types: RefItem[];
  brands: RefItem[];
  branches: RefItem[];
}) {
  return (
    <ActionForm
      action={mode === "create" ? createMachine : updateMachine}
      className="grid gap-3 sm:grid-cols-2"
    >
      {mode === "edit" && machine ? (
        <input type="hidden" name="id" value={machine.id} />
      ) : null}
      <Field label="Code">
        <input
          className={inputClassName}
          name="code"
          required
          defaultValue={machine?.code ?? ""}
          placeholder="EXC-001"
        />
      </Field>
      <Field label="Name">
        <input
          className={inputClassName}
          name="name"
          required
          defaultValue={machine?.name ?? ""}
        />
      </Field>
      <Field label="Type">
        <select
          className={selectClassName}
          name="machine_type_id"
          defaultValue={machine?.machine_type_id ?? ""}
        >
          <option value="">—</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label ?? t.key}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Brand">
        <select
          className={selectClassName}
          name="machine_brand_id"
          defaultValue={machine?.machine_brand_id ?? ""}
        >
          <option value="">—</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label ?? b.key}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Branch">
        <select
          className={selectClassName}
          name="branch_id"
          defaultValue={machine?.branch_id ?? ""}
        >
          <option value="">—</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name ?? b.code}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea
          className={textareaClassName}
          name="notes"
          defaultValue={machine?.notes ?? ""}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit">
          {mode === "create" ? "Create machine" : "Save machine"}
        </Button>
      </div>
    </ActionForm>
  );
}
