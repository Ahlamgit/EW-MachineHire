"use client";

import { ActionForm } from "@/components/shared/action-form";
import {
  Field,
  inputClassName,
  selectClassName,
  textareaClassName,
} from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { createCustomer, createSite } from "@/features/customers/actions";

export function CreateCustomerForm() {
  return (
    <ActionForm action={createCustomer} className="grid gap-3 sm:grid-cols-2">
      <Field label="Code">
        <input className={inputClassName} name="code" required />
      </Field>
      <Field label="Name">
        <input className={inputClassName} name="name" required />
      </Field>
      <Field label="Phone">
        <input className={inputClassName} name="phone" />
      </Field>
      <Field label="Email">
        <input className={inputClassName} name="email" type="email" />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea className={textareaClassName} name="notes" />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit">Create customer</Button>
      </div>
    </ActionForm>
  );
}

export function CreateSiteForm({
  customers,
}: {
  customers: Array<{ id: string; code: string; name: string }>;
}) {
  return (
    <ActionForm action={createSite} className="grid gap-3 sm:grid-cols-2">
      <Field label="Customer" className="sm:col-span-2">
        <select className={selectClassName} name="customer_id" required>
          <option value="">Select</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Site name">
        <input className={inputClassName} name="name" required />
      </Field>
      <Field label="Address">
        <input className={inputClassName} name="address" />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea className={textareaClassName} name="notes" />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit">Create site</Button>
      </div>
    </ActionForm>
  );
}
