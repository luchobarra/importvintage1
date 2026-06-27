"use client";

import type { CatalogCategory } from "@/features/catalog-options/types";
import {
  createPublicCatalogHref,
  emptyPublicCatalogState,
} from "@/features/products/public-filters";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type PublicHeaderProps = {
  categories: CatalogCategory[];
};

const TAGLINE = "Lo bueno nunca pasa de moda";

export function PublicHeader({ categories }: PublicHeaderProps) {
  const menuId = useId();
  const categoriesId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen && !isProductsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsProductsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, isProductsOpen]);

  useEffect(() => {
    if (!isProductsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        productsRef.current &&
        !productsRef.current.contains(event.target as Node)
      ) {
        setIsProductsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isProductsOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
    setIsProductsOpen(false);
  }

  function closeProducts() {
    setIsProductsOpen(false);
  }

  return (
    <header className="public-header">
      <div className="public-header__inner ui-page-container">
        <button
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          className="public-header__menu-button"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
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
              aria-expanded={isProductsOpen}
              className="public-header__nav-button"
              data-open={isProductsOpen}
              onClick={() => setIsProductsOpen((currentValue) => !currentValue)}
              type="button"
            >
              Productos
              <span aria-hidden="true" />
            </button>
            <div className="public-header__dropdown" data-open={isProductsOpen}>
              <Link
                className="public-header__dropdown-link"
                href="/"
                onClick={closeProducts}
              >
                Todos los productos
              </Link>
              {categories.map((category) => (
                <Link
                  className="public-header__dropdown-link"
                  href={getCategoryHref(category.slug)}
                  key={category.id}
                  onClick={closeProducts}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <a className="public-header__nav-link" href="#novedades">
            Novedades
          </a>
          <a className="public-header__nav-link" href="#contacto">
            Contacto
          </a>
        </nav>

        <p className="public-header__tagline">{TAGLINE}</p>
        <span aria-hidden="true" className="public-header__mobile-spacer" />
      </div>

      {isMenuOpen ? (
        <>
          <div
            className="public-header__mobile-overlay"
            data-open={isMenuOpen}
            onClick={closeMenu}
          />
          <aside
            className="public-header__mobile-panel"
            data-open={isMenuOpen}
            id={menuId}
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
                aria-expanded={isProductsOpen}
                className="public-header__mobile-link"
                data-open={isProductsOpen}
                onClick={() => setIsProductsOpen((currentValue) => !currentValue)}
                type="button"
              >
                Productos
                <span aria-hidden="true" className="public-header__mobile-link-icon" />
              </button>

              <div
                className="public-header__mobile-categories"
                data-open={isProductsOpen}
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

              <a className="public-header__mobile-link" href="#novedades" onClick={closeMenu}>
                Novedades
              </a>
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
