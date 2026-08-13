import "@testing-library/jest-dom/vitest";
import React, { type ReactNode } from "react";
import { vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    ViewTransition: ({
      children,
    }: {
      children: ReactNode;
      name?: string;
    }) => actual.createElement(actual.Fragment, null, children),
  };
});

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  usePathname: () => "/",
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: (imageProps: {
    alt?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    unoptimized?: boolean;
    src: string;
  }) => {
    const { alt, fill, priority, sizes, src, unoptimized, ...props } =
      imageProps;

    void fill;
    void priority;
    void sizes;
    void unoptimized;

    return React.createElement("img", { alt, src, ...props });
  },
}));

vi.mock("next/link", () => ({
  default: (linkProps: {
    children: ReactNode;
    href: string | { pathname?: string };
    prefetch?: boolean;
    transitionTypes?: string[];
  }) => {
    const { children, href, prefetch, transitionTypes, ...props } = linkProps;

    void prefetch;
    void transitionTypes;

    return React.createElement(
      "a",
      {
        href: typeof href === "string" ? href : href.pathname ?? "",
        ...props,
      },
      children,
    );
  },
  useLinkStatus: () => ({ pending: false }),
}));
