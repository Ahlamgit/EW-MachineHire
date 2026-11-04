"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { placeholderSignInSchema, type PlaceholderSignInValues } from "@/lib/validations/common";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlaceholderSignInValues>({
    resolver: zodResolver(placeholderSignInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: PlaceholderSignInValues) {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Supabase client is not configured.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    router.replace(nextPath || "/");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="h-10 w-full rounded-md border border-[var(--ew-border)] bg-[var(--ew-white)] px-3 text-sm outline-none ring-[var(--ew-blue)] focus:ring-2"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-[var(--ew-danger)]">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-10 w-full rounded-md border border-[var(--ew-border)] bg-[var(--ew-white)] px-3 text-sm outline-none ring-[var(--ew-blue)] focus:ring-2"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-[var(--ew-danger)]">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      {formError ? (
        <p className="text-sm text-[var(--ew-danger)]">{formError}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
