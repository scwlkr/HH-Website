"use client";

import { FirebaseError } from "firebase/app";
import { useActionState } from "react";
import { loginAdminAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearFirebaseClientAuth,
  signInForAdminSession,
} from "@/lib/firebase/client";
import {
  getAdminLoginValues,
  mapAdminLoginFieldErrors,
  validateAdminLoginValues,
} from "@/lib/validation/operations";
import {
  adminLoginActionInitialState,
  type AdminLoginActionState,
} from "@/types/operations";

type AdminLoginFormProps = {
  nextPath: string;
};

function normalizeNextPath(nextPath: string) {
  return /^\/admin(?:\/|$|\?)/.test(nextPath)
    ? nextPath
    : "/admin/projects";
}

function getFirebaseLoginErrorState(error: unknown): AdminLoginActionState {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/user-disabled") {
      return {
        status: "server-error",
        message: "This account has been disabled.",
        fieldErrors: {},
      };
    }

    if (error.code === "auth/too-many-requests") {
      return {
        status: "server-error",
        message: "Too many sign-in attempts. Wait a moment and try again.",
        fieldErrors: {},
      };
    }

    if (error.code === "auth/network-request-failed") {
      return {
        status: "server-error",
        message: "The login service could not be reached. Try again.",
        fieldErrors: {},
      };
    }
  }

  return {
    status: "server-error",
    message: "Email or password is incorrect.",
    fieldErrors: {},
  };
}

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  async function loginWithFirebase(
    previousState: AdminLoginActionState,
    formData: FormData,
  ): Promise<AdminLoginActionState> {
    void previousState;

    const values = getAdminLoginValues(formData);
    const validationResult = validateAdminLoginValues(values);

    if (!validationResult.success) {
      return {
        status: "field-error",
        message: "Review the highlighted fields and try again.",
        fieldErrors: mapAdminLoginFieldErrors(validationResult.error),
      };
    }

    let idToken: string;

    try {
      idToken = await signInForAdminSession(
        validationResult.data.email,
        validationResult.data.password,
      );
    } catch (error) {
      await clearFirebaseClientAuth().catch(() => undefined);
      return getFirebaseLoginErrorState(error);
    }

    const sessionFormData = new FormData();
    sessionFormData.set("idToken", idToken);

    let sessionState: AdminLoginActionState;

    try {
      sessionState = await loginAdminAction(
        adminLoginActionInitialState,
        sessionFormData,
      );
    } catch (error) {
      console.error("Admin session creation failed", error);
      sessionState = {
        status: "server-error",
        message: "HHQ login could not be completed right now.",
        fieldErrors: {},
      };
    } finally {
      await clearFirebaseClientAuth().catch((error) => {
        console.error("Firebase client sign-out failed", error);
      });
    }

    if (sessionState.status === "idle") {
      window.location.assign(normalizeNextPath(nextPath));
    }

    return sessionState;
  }

  const [state, formAction, pending] = useActionState(
    loginWithFirebase,
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
        className="hh-admin-button w-full rounded-[var(--hh-radius-tight)]"
        disabled={pending}
      >
        {pending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
