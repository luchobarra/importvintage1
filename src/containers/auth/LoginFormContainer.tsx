"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { login, type AuthFormState } from "@/features/auth/actions";
import { useActionState } from "react";

const initialState: AuthFormState = {
  message: "",
};

export function LoginFormContainer() {
  const [state, action, pending] = useActionState(login, initialState);

  return <LoginForm action={action} pending={pending} state={state} />;
}

