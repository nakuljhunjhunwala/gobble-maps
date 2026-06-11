"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { Field } from "@/components/ui/field";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <Field label="Email">
        <input
          className="gb-input"
          type="email"
          name="email"
          placeholder="you@gobblemaps.in"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Password">
        <input
          className="gb-input"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </Field>
      {state && !state.ok && (
        <p style={{ fontSize: 12.5, fontWeight: 600, color: "#B4514B" }}>
          {state.error}
        </p>
      )}
      <button className="gb-btn" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
