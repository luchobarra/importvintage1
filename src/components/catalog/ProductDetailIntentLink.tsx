"use client";

import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

type ProductDetailIntentLinkProps = {
  ariaCurrent?: "true";
  ariaLabel: string;
  children: ReactNode;
  className: string;
  href: string;
  style?: CSSProperties;
  transitionTypes?: string[];
};

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

  function prefetchDetail() {
    if (didPrefetch.current) {
      return;
    }

    didPrefetch.current = true;
    router.prefetch(href);
  }

  return (
    <Link
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      className={className}
      href={href}
      onFocus={prefetchDetail}
      onMouseEnter={prefetchDetail}
      onPointerDown={prefetchDetail}
      onTouchStart={prefetchDetail}
      prefetch={false}
      style={style}
      transitionTypes={transitionTypes}
    >
      {children}
      <ProductDetailLinkStatus />
    </Link>
  );
}

function ProductDetailLinkStatus() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`product-detail-link-status${pending ? " is-pending" : ""}`}
    />
  );
}
