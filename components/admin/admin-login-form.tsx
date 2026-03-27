"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLoginActionInitialState } from "@/types/operations";
import { loginAdminAction } from "@/app/admin/actions";

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const [state, formAction, pending] = useActionState(
    loginAdminAction,
    adminLoginActionInitialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        className="rounded-[var(--hh-radius-tight)]"
        error={state.fieldErrors.email}
        required
      />

      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        className="rounded-[var(--hh-radius-tight)]"
        error={state.fieldErrors.password}
        required
      />

      {state.message ? (
        <p className="text-sm text-accent-strong">{state.message}</p>
      ) : null}

      <Button
        type="submit"
        className="w-full rounded-[var(--hh-radius-tight)]"
        disabled={pending}
      >
        {pending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
