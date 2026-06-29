"use client";

import type { CatalogCategory } from "@/features/catalog-options/types";
import {
  createPublicCatalogHref,
  emptyPublicCatalogState,
} from "@/features/products/public-filters";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type PublicHeaderProps = {
  categories: CatalogCategory[];
};

const TAGLINE = "Lo bueno nunca pasa de moda";

export function PublicHeader({ categories }: PublicHeaderProps) {
  const menuId = useId();
  const categoriesId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isDesktopProductsOpen, setIsDesktopProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="public-header" style={{ viewTransitionName: "site-header" }}>
      <div className="public-header__inner ui-page-container">
        <button
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          className="public-header__menu-button"
          onClick={toggleMenu}
          type="button"
        >
          <Menu aria-hidden="true" size={28} strokeWidth={1.7} />
        </button>

        <div className="public-header__identity">
          <Link className="public-header__brand" href="/">
            <span className="public-header__brand-kicker">Old Times</span>
            <span className="public-header__brand-mark">
              <span aria-hidden="true" />
              Vintage
              <span aria-hidden="true" />
            </span>
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
          <Link className="public-header__nav-link" href={getRecentProductsHref()}>
            Novedades
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
              <Link className="public-header__mobile-brand" href="/" onClick={closeMenu}>
                <span className="public-header__brand-kicker">Old Times</span>
                <span className="public-header__brand-mark">
                  <span aria-hidden="true" />
                  Vintage
                  <span aria-hidden="true" />
                </span>
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
                <Link href="/" onClick={closeMenu}>
                  Todos los productos
                </Link>
                {categories.map((category) => (
                  <Link
                    href={getCategoryHref(category.slug)}
                    key={category.id}
                    onClick={closeMenu}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <Link
                className="public-header__mobile-link"
                href={getExclusiveProductsHref()}
                onClick={closeMenu}
              >
                Exclusivos
              </Link>
              <Link
                className="public-header__mobile-link"
                href={getRecentProductsHref()}
                onClick={closeMenu}
              >
                Novedades
              </Link>
              <a className="public-header__mobile-link" href="#contacto" onClick={closeMenu}>
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

function getRecentProductsHref() {
  return createPublicCatalogHref({
    ...emptyPublicCatalogState,
    recent: true,
  });
}

function getExclusiveProductsHref() {
  return createPublicCatalogHref({
    ...emptyPublicCatalogState,
    exclusive: true,
  });
}
