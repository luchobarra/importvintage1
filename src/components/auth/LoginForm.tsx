"use client";

import type { AuthFormState } from "@/features/auth/actions";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useId, useState } from "react";

type LoginFormProps = {
  action: (formData: FormData) => void;
  pending: boolean;
  state: AuthFormState;
};

export function LoginForm({ action, pending, state }: LoginFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const emailError = state.fieldErrors?.email ?? "";
  const passwordError = state.fieldErrors?.password ?? "";
  const emailErrorId = useId();
  const passwordErrorId = useId();

  return (
    <form action={action} className="auth-form" noValidate>
      <label
        className={`form-field${emailError ? " form-field--error" : ""}`}
        htmlFor="email"
      >
        <span className="text-label">Email</span>
        <input
          aria-describedby={emailError ? emailErrorId : undefined}
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          disabled={pending}
          id="email"
          name="email"
          required
          type="email"
        />
        {emailError ? (
          <small className="form-field__error" id={emailErrorId} role="alert">
            {emailError}
          </small>
        ) : null}
      </label>

      <div
        className={`form-field${passwordError ? " form-field--error" : ""}`}
      >
        <label className="text-label" htmlFor="password">
          Contraseña
        </label>
        <div className="auth-form__password-control">
          <input
            aria-describedby={passwordError ? passwordErrorId : undefined}
            aria-invalid={Boolean(passwordError)}
            autoComplete="current-password"
            disabled={pending}
            id="password"
            name="password"
            required
            type={isPasswordVisible ? "text" : "password"}
          />
          <button
            aria-label={
              isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            className="auth-form__password-toggle"
            disabled={pending}
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
          >
            {isPasswordVisible ? (
              <EyeOff aria-hidden="true" size={17} />
            ) : (
              <Eye aria-hidden="true" size={17} />
            )}
          </button>
        </div>
        {passwordError ? (
          <small
            className="form-field__error"
            id={passwordErrorId}
            role="alert"
          >
            {passwordError}
          </small>
        ) : null}
      </div>

      {state.message ? (
        <p aria-live="polite" className="auth-form__error text-error">
          {state.message}
        </p>
      ) : null}

      <button className="button button--primary" disabled={pending} type="submit">
        <LogIn aria-hidden="true" size={16} />
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
