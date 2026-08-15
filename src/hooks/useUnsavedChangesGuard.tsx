"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type PendingNavigation =
  | {
      href: string;
      type: "link";
    }
  | {
      type: "back";
    };

type UseUnsavedChangesGuardOptions = {
  description?: string;
  title?: string;
};

export function useUnsavedChangesGuard({
  description = "Si salís ahora, vas a perder los cambios que todavía no guardaste.",
  title = "Hay cambios sin guardar",
}: UseUnsavedChangesGuardOptions = {}) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const isDirtyRef = useRef(false);
  const hasHistoryGuardRef = useRef(false);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setIsDirty(true);
  }, []);

  const clearDirty = useCallback(() => {
    isDirtyRef.current = false;
    setIsDirty(false);
    setPendingNavigation(null);
  }, []);

  const requestNavigation = useCallback(
    (href: string) => {
      if (!isDirtyRef.current) {
        router.push(href);
        return;
      }

      setPendingNavigation({ href, type: "link" });
    },
    [router],
  );

  const confirmNavigation = useCallback(() => {
    const navigation = pendingNavigation;

    if (!navigation) {
      return;
    }

    clearDirty();

    if (navigation.type === "back") {
      window.history.go(-2);
      return;
    }

    const targetUrl = new URL(navigation.href, window.location.origin);

    if (targetUrl.origin === window.location.origin) {
      router.push(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      return;
    }

    window.location.assign(targetUrl.toString());
  }, [clearDirty, pendingNavigation, router]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!isDirtyRef.current || isModifiedClick(event)) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement) || shouldIgnoreLink(link)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation({ href: link.href, type: "link" });
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || hasHistoryGuardRef.current) {
      return;
    }

    window.history.pushState({ unsavedChangesGuard: true }, "", window.location.href);
    hasHistoryGuardRef.current = true;
  }, [isDirty]);

  useEffect(() => {
    function handlePopState() {
      if (!isDirtyRef.current) {
        return;
      }

      setPendingNavigation({ type: "back" });
      window.history.pushState(
        { unsavedChangesGuard: true },
        "",
        window.location.href,
      );
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const dialog: ReactNode = (
    <ConfirmDialog
      cancelLabel="Seguir editando"
      confirmLabel="Salir sin guardar"
      description={description}
      isOpen={pendingNavigation !== null}
      onCancel={cancelNavigation}
      onConfirm={confirmNavigation}
      title={title}
      variant="danger"
    />
  );

  return {
    clearDirty,
    dialog,
    isDirty,
    markDirty,
    requestNavigation,
  };
}

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function shouldIgnoreLink(link: HTMLAnchorElement) {
  if (link.target && link.target !== "_self") {
    return true;
  }

  if (link.hasAttribute("download")) {
    return true;
  }

  const href = link.getAttribute("href");

  if (!href || href.startsWith("#")) {
    return true;
  }

  const normalizedHref = href.toLowerCase();

  if (
    normalizedHref.startsWith("mailto:") ||
    normalizedHref.startsWith("tel:") ||
    normalizedHref.startsWith("javascript:")
  ) {
    return true;
  }

  const targetUrl = new URL(link.href, window.location.origin);

  return (
    targetUrl.origin === window.location.origin &&
    targetUrl.pathname === window.location.pathname &&
    targetUrl.search === window.location.search &&
    targetUrl.hash !== ""
  );
}
