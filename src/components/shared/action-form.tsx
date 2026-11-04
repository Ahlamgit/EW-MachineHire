"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/workflow/errors";

type ActionFormProps = {
  action: (formData: FormData) => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  className?: string;
  successRedirect?: string;
};

export function ActionForm({
  action,
  children,
  className,
}: ActionFormProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await action(formData);
          if (result.ok) {
            setMessage(result.message ?? "Saved.");
            (event.target as HTMLFormElement).reset();
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {pending ? (
        <p className="mt-2 text-xs text-[var(--ew-muted)]">Saving…</p>
      ) : null}
      {message ? (
        <p className="mt-2 text-sm text-[var(--ew-green)]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-[var(--ew-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
