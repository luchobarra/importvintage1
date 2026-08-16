"use client";

import { useEffect } from "react";

export function PublicScrollRestoration() {
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
