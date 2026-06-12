"use client";

import { expireAdminSession } from "@/features/auth/actions";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type AdminSessionTimeoutContainerProps = {
  children: ReactNode;
  onSessionExpired?: () => Promise<void> | void;
  timeoutMs?: number;
};

const DEFAULT_ADMIN_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const TEST_TIMEOUT_STORAGE_KEY = "admin-session-timeout-ms";
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export function AdminSessionTimeoutContainer({
  children,
  onSessionExpired = expireAdminSession,
  timeoutMs = getAdminSessionTimeoutMs(),
}: AdminSessionTimeoutContainerProps) {
  const timeoutRef = useRef<number | null>(null);
  const hasExpiredRef = useRef(false);
  const onSessionExpiredRef = useRef(onSessionExpired);

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  useEffect(() => {
    function clearSessionTimeout() {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function expireSession() {
      if (hasExpiredRef.current) {
        return;
      }

      hasExpiredRef.current = true;
      clearSessionTimeout();
      void onSessionExpiredRef.current();
    }

    function resetSessionTimeout() {
      if (hasExpiredRef.current) {
        return;
      }

      clearSessionTimeout();
      timeoutRef.current = window.setTimeout(expireSession, timeoutMs);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        resetSessionTimeout();
      }
    }

    resetSessionTimeout();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetSessionTimeout, { passive: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearSessionTimeout();

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetSessionTimeout);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeoutMs]);

  return <>{children}</>;
}

export function getAdminSessionTimeoutMs() {
  const testTimeout = getTestAdminSessionTimeoutMs();

  if (testTimeout !== null) {
    return testTimeout;
  }

  const configuredTimeout = Number(process.env.NEXT_PUBLIC_ADMIN_SESSION_TIMEOUT_MS);

  if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
    return configuredTimeout;
  }

  return DEFAULT_ADMIN_SESSION_TIMEOUT_MS;
}

function getTestAdminSessionTimeoutMs() {
  if (
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_SESSION_TIMEOUT_OVERRIDE !== "true" ||
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const configuredTimeout = Number(
      window.localStorage.getItem(TEST_TIMEOUT_STORAGE_KEY),
    );

    if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
      return configuredTimeout;
    }
  } catch {
    return null;
  }

  return null;
}
