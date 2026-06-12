import type { AuthFormState } from "@/features/auth/actions";

type LoginFormProps = {
  action: (formData: FormData) => void;
  pending: boolean;
  state: AuthFormState;
};

export function LoginForm({ action, pending, state }: LoginFormProps) {
  return (
    <form action={action} className="auth-form">
      <label className="form-field" htmlFor="email">
        <span>Email</span>
        <input
          autoComplete="email"
          id="email"
          name="email"
          required
          type="email"
        />
      </label>

      <label className="form-field" htmlFor="password">
        <span>Contrasena</span>
        <input
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </label>

      {state.message ? (
        <p aria-live="polite" className="auth-form__error">
          {state.message}
        </p>
      ) : null}

      <button className="button button--primary" disabled={pending} type="submit">
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

