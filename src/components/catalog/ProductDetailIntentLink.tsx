"use client";

import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ProductDetailIntentLinkProps = {
  ariaCurrent?: "true";
  ariaLabel: string;
  children: ReactNode;
  className: string;
  href: string;
  style?: CSSProperties;
  transitionTypes?: string[];
};

const PRODUCT_DETAIL_NAVIGATION_DELAY_MS = 620;

export function ProductDetailIntentLink({
  ariaCurrent,
  ariaLabel,
  children,
  className,
  href,
  style,
  transitionTypes,
}: ProductDetailIntentLinkProps) {
  const router = useRouter();
  const didPrefetch = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);
  const [isIntentLoading, setIsIntentLoading] = useState(false);

  function prefetchDetail() {
    if (didPrefetch.current) {
      return;
    }

    didPrefetch.current = true;
    router.prefetch(href);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isIntentLoading) {
      event.preventDefault();
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    setIsIntentLoading(true);
    prefetchDetail();

    navigationTimeoutRef.current = window.setTimeout(() => {
      navigationTimeoutRef.current = null;
      router.push(href, {
        transitionTypes,
      });
    }, PRODUCT_DETAIL_NAVIGATION_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, [href]);

  return (
    <Link
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      aria-busy={isIntentLoading}
      className={className}
      data-loading={isIntentLoading ? "true" : undefined}
      href={href}
      onFocus={prefetchDetail}
      onClick={handleClick}
      onMouseEnter={prefetchDetail}
      onPointerDown={prefetchDetail}
      onTouchStart={prefetchDetail}
      prefetch={false}
      style={style}
      transitionTypes={transitionTypes}
    >
      {children}
      <ProductDetailLinkStatus showImmediately={isIntentLoading} />
    </Link>
  );
}

function ProductDetailLinkStatus({
  showImmediately,
}: {
  showImmediately: boolean;
}) {
  const { pending } = useLinkStatus();
  const isVisible = pending || showImmediately;

  return (
    <span
      aria-hidden="true"
      className={`product-detail-link-status${isVisible ? " is-pending" : ""}`}
    />
  );
}
