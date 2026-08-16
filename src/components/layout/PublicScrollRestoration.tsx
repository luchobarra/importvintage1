"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

export function PublicScrollRestoration() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;

    if (pathname.startsWith("/productos/")) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) {
      return;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const navigation = window.performance.getEntriesByType("navigation")[0];
    const navigationType =
      navigation instanceof PerformanceNavigationTiming
        ? navigation.type
        : undefined;

    if (navigationType === "reload") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: 0, top: 0 });
      });
    }

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
