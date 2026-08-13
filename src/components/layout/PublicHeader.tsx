"use client";

import type { CatalogCategory } from "@/features/catalog-options/types";
import {
  createPublicCatalogHref,
  emptyPublicCatalogState,
} from "@/features/products/public-filters";
import { AlignJustify, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";

type PublicHeaderProps = {
  categories: CatalogCategory[];
};

const TAGLINE = "Lo bueno nunca pasa de moda";

export function PublicHeader({ categories }: PublicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const categoriesId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isDesktopProductsOpen, setIsDesktopProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");
  const closeTimeoutRef = useRef<number | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const searchParams = new URLSearchParams(currentSearch);
  const selectedCategory = searchParams.get("category") ?? "";
  const hasExclusiveFilter = searchParams.get("exclusivos") === "1";
  const isCatalogRoute = pathname === "/";
  const isAllProductsSelected =
    isCatalogRoute && selectedCategory === "" && !hasExclusiveFilter;

  const closeMenu = useCallback(() => {
    if (!isMenuOpen || isMenuClosing) {
      return;
    }

    setIsMenuClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      setIsMobileProductsOpen(false);
      closeTimeoutRef.current = null;
    }, 340);
  }, [isMenuClosing, isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen && !isDesktopProductsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        setIsDesktopProductsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, isDesktopProductsOpen, isMenuOpen]);

  useEffect(() => {
    function syncCurrentSearch() {
      setCurrentSearch(window.location.search);
    }

    syncCurrentSearch();
    window.addEventListener("popstate", syncCurrentSearch);

    return () => window.removeEventListener("popstate", syncCurrentSearch);
  }, []);

  useEffect(() => {
    if (!isDesktopProductsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        productsRef.current &&
        !productsRef.current.contains(event.target as Node)
      ) {
        setIsDesktopProductsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isDesktopProductsOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    document.body.classList.add("public-header-menu-open");

    return () => {
      document.body.classList.remove("public-header-menu-open");
    };
  }, [isMenuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function openMenu() {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsMenuClosing(false);
    setIsMenuOpen(true);
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  function closeDesktopProducts() {
    setIsDesktopProductsOpen(false);
  }

  function handleHomeLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    setCurrentSearch("");
    router.push("/", { scroll: false });

    if (isMenuOpen) {
      closeMenu();
      window.setTimeout(scrollToPageTop, 380);
      return;
    }

    window.setTimeout(scrollToPageTop, 60);
  }

  function handleMobileCatalogLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    closeMenu();
    setCurrentSearch(new URL(href, window.location.origin).search);
    router.push(href, { scroll: false });
    scrollToCatalogStart();
  }

  function handleMobileContactClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    closeMenu();

    window.setTimeout(() => {
      scrollToContactSection();
    }, 380);
  }

  return (
    <header className="public-header">
      <div className="public-header__inner ui-page-container">
        <button
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          className="public-header__menu-button"
          onClick={toggleMenu}
          type="button"
        >
          <AlignJustify
            aria-hidden="true"
            className="public-header__menu-icon"
            size={21}
            strokeWidth={2.45}
          />
        </button>

        <div className="public-header__identity">
          <Link
            aria-label="Ir al inicio de Retro Campus"
            className="public-header__brand"
            href="/"
            onClick={handleHomeLogoClick}
          >
            <BrandLogo
              className="public-header__brand-logo"
              preload
              sizes="(max-width: 640px) 76px, 96px"
            />
          </Link>
          <p className="public-header__mobile-inline-tagline">{TAGLINE}</p>
        </div>

        <nav aria-label="Navegacion principal" className="public-header__nav">
          <div
            className="public-header__nav-item public-header__nav-item--dropdown"
            ref={productsRef}
          >
            <button
              aria-expanded={isDesktopProductsOpen}
              className="public-header__nav-button"
              data-open={isDesktopProductsOpen}
              onClick={() =>
                setIsDesktopProductsOpen((currentValue) => !currentValue)
              }
              type="button"
            >
              Productos
              <span aria-hidden="true" />
            </button>
            <div
              className="public-header__dropdown"
              data-open={isDesktopProductsOpen}
            >
              <Link
                className="public-header__dropdown-link"
                href="/"
                onClick={closeDesktopProducts}
              >
                Todos los productos
              </Link>
              {categories.map((category) => (
                <Link
                  className="public-header__dropdown-link"
                  href={getCategoryHref(category.slug)}
                  key={category.id}
                  onClick={closeDesktopProducts}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <Link className="public-header__nav-link" href={getExclusiveProductsHref()}>
            Exclusivos
          </Link>
          <a className="public-header__nav-link" href="#contacto">
            Contacto
          </a>
        </nav>

        <p className="public-header__tagline">{TAGLINE}</p>
        <span aria-hidden="true" className="public-header__mobile-spacer" />
      </div>

      {isMenuOpen ? (
        <>
          <button
            aria-label="Cerrar menu"
            className="public-header__mobile-overlay"
            data-state={isMenuClosing ? "closing" : "open"}
            onClick={closeMenu}
            type="button"
          />
          <aside
            aria-label="Menu principal"
            aria-modal="true"
            className="public-header__mobile-panel"
            data-state={isMenuClosing ? "closing" : "open"}
            id={menuId}
            role="dialog"
          >
            <div className="public-header__mobile-head">
              <Link
                aria-label="Ir al inicio de Retro Campus"
                className="public-header__mobile-brand"
                href="/"
                onClick={handleHomeLogoClick}
              >
                <BrandLogo
                  className="public-header__mobile-brand-logo"
                  sizes="96px"
                />
              </Link>
              <button
                aria-label="Cerrar menu"
                className="public-header__close-button"
                onClick={closeMenu}
                type="button"
              >
                <X aria-hidden="true" size={26} strokeWidth={1.7} />
              </button>
            </div>

            <p className="public-header__mobile-tagline">{TAGLINE}</p>

            <nav aria-label="Menu mobile" className="public-header__mobile-nav">
              <button
                aria-controls={categoriesId}
                aria-expanded={isMobileProductsOpen}
                className="public-header__mobile-link"
                data-open={isMobileProductsOpen}
                onClick={() =>
                  setIsMobileProductsOpen((currentValue) => !currentValue)
                }
                type="button"
              >
                Productos
                <ChevronDown
                  aria-hidden="true"
                  className="public-header__mobile-link-icon"
                  size={18}
                  strokeWidth={1.8}
                />
              </button>

              <div
                className="public-header__mobile-categories"
                data-open={isMobileProductsOpen}
                id={categoriesId}
              >
                <Link
                  data-current={isAllProductsSelected}
                  href="/"
                  onClick={(event) => handleMobileCatalogLinkClick(event, "/")}
                >
                  Todos los productos
                </Link>
                {categories.map((category) => (
                  <Link
                    data-current={
                      isCatalogRoute && selectedCategory === category.slug
                    }
                    href={getCategoryHref(category.slug)}
                    key={category.id}
                    onClick={(event) =>
                      handleMobileCatalogLinkClick(
                        event,
                        getCategoryHref(category.slug),
                      )
                    }
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <Link
                className="public-header__mobile-link"
                data-current={isCatalogRoute && hasExclusiveFilter}
                href={getExclusiveProductsHref()}
                onClick={(event) =>
                  handleMobileCatalogLinkClick(event, getExclusiveProductsHref())
                }
              >
                Exclusivos
              </Link>
              <a
                className="public-header__mobile-link"
                href="#contacto-directo"
                onClick={handleMobileContactClick}
              >
                Contacto
              </a>
            </nav>
          </aside>
        </>
      ) : null}
    </header>
  );
}

function getCategoryHref(categorySlug: string) {
  return createPublicCatalogHref({
    ...emptyPublicCatalogState,
    category: categorySlug,
  });
}

function getExclusiveProductsHref() {
  return createPublicCatalogHref({
    ...emptyPublicCatalogState,
    exclusive: true,
  });
}

function scrollToCatalogStart() {
  const catalogStart = document.querySelector<HTMLElement>(".home__container");
  const header = document.querySelector<HTMLElement>(".public-header");
  const headerOffset = header?.getBoundingClientRect().height ?? 0;
  const top = catalogStart
    ? catalogStart.getBoundingClientRect().top + window.scrollY - headerOffset
    : 0;

  window.scrollTo({
    behavior: "smooth",
    top: Math.max(0, top),
  });
}

function scrollToPageTop() {
  window.scrollTo({
    behavior: "smooth",
    top: 0,
  });
}

function scrollToContactSection() {
  const contactSection = document.querySelector<HTMLElement>("#contacto-directo");
  const header = document.querySelector<HTMLElement>(".public-header");

  if (!contactSection) {
    return;
  }

  const headerOffset = header?.getBoundingClientRect().height ?? 0;
  const top =
    contactSection.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({
    behavior: "smooth",
    top: Math.max(0, top),
  });
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  );
}
