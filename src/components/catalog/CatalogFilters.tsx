"use client";

import type {
  CatalogOptions,
  CatalogSize,
} from "@/features/catalog-options/types";
import {
  createPublicCatalogHref,
  DEFAULT_PUBLIC_PRODUCT_SORT,
  type PublicCatalogState,
  type PublicProductSort,
} from "@/features/products/public-filters";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CatalogFiltersProps = {
  hasActiveControls: boolean;
  options: CatalogOptions;
  state: PublicCatalogState;
};

export function CatalogFilters({
  hasActiveControls,
  options,
  state,
}: CatalogFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSortSectionOpen, setIsSortSectionOpen] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(
    state.category,
  );
  const applyTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const filterFormRef = useRef<HTMLFormElement>(null);
  const sortDetailsRef = useRef<HTMLDetailsElement>(null);
  const availableSizes = useMemo(
    () => getAvailableSizes(options, selectedCategorySlug),
    [options, selectedCategorySlug],
  );
  const activeItems = useMemo(
    () => getActiveItems(options, state),
    [options, state],
  );
  const letterSizes = availableSizes.filter(
    (size) => size.size_group === "letter",
  );
  const numericSizes = availableSizes.filter(
    (size) => size.size_group === "numeric",
  );
  const isSelectedSizeAvailable = availableSizes.some(
    (size) => size.value === state.size,
  );
  const effectiveSelectedSize = isSelectedSizeAvailable ? state.size : "";

  const closeFilters = useCallback(() => {
    if (!isOpen || isClosing) {
      return;
    }

    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 340);
  }, [isClosing, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFilters();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("catalog-filters-open");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("catalog-filters-open");
    };
  }, [closeFilters, isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (applyTimeoutRef.current !== null) {
        window.clearTimeout(applyTimeoutRef.current);
      }
    };
  }, []);

  function openFilters(section: "sort" | null = null) {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsSortSectionOpen(section === "sort");
    setIsApplying(false);
    setIsClosing(false);
    setIsOpen(true);

    if (section === "sort" && sortDetailsRef.current) {
      sortDetailsRef.current.open = true;
    }
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    if (isApplying) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setIsApplying(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosing(true);
    }, 420);
    applyTimeoutRef.current = window.setTimeout(() => {
      filterFormRef.current?.submit();
    }, 1250);
  }

  return (
    <section className="catalog-filters" aria-label="Controles del catalogo">
      <div className="catalog-filters__toolbar">
        <button
          aria-expanded={isOpen}
          className="catalog-filters__trigger"
          onClick={() => openFilters()}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={14} strokeWidth={2} />
          <span>Filtrar</span>
        </button>

        <span className="catalog-filters__divider" aria-hidden="true">
          |
        </span>

        <button
          aria-expanded={isOpen}
          className="catalog-filters__sort-trigger"
          onClick={() => openFilters("sort")}
          type="button"
        >
          <ArrowDownUp aria-hidden="true" size={14} strokeWidth={2} />
          <span>Ordenar</span>
        </button>
      </div>

      <div
        className="catalog-filters__active-band"
        data-empty={activeItems.length === 0}
      >
        {activeItems.length > 0 ? (
          <div className="catalog-filters__chips" aria-label="Filtros activos">
            {activeItems.map((item) => (
              <Link
                className="catalog-filters__chip"
                href={item.href}
                key={item.key}
              >
                <span>{item.label}</span>
                <X aria-hidden="true" size={12} strokeWidth={2} />
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div
          className="catalog-filters__overlay"
          data-state={isClosing ? "closing" : "open"}
          role="presentation"
        >
          <button
            aria-label="Cerrar filtros"
            className="catalog-filters__backdrop"
            onClick={closeFilters}
            type="button"
          />
          <aside
            aria-label="Filtros del catalogo"
            aria-modal="true"
            className="catalog-filters__drawer"
            data-state={isClosing ? "closing" : "open"}
            role="dialog"
          >
            <div className="catalog-filters__drawer-header">
              <div>
                <p className="catalog-filters__eyebrow">Catalogo</p>
                <h2 className="catalog-filters__title">Filtros</h2>
              </div>
              <button
                aria-label="Cerrar filtros"
                className="catalog-filters__close"
                onClick={closeFilters}
                type="button"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.8} />
              </button>
            </div>

            <form
              action="/"
              className="catalog-filters__form"
              onSubmit={handleFilterSubmit}
              ref={filterFormRef}
            >
              {activeItems.length > 0 ? (
                <div
                  className="catalog-filters__drawer-chips"
                  aria-label="Filtros seleccionados"
                >
                  {activeItems.map((item) => (
                    <Link
                      className="catalog-filters__drawer-chip"
                      href={item.href}
                      key={item.key}
                    >
                      <span>{item.label}</span>
                      <X aria-hidden="true" size={12} strokeWidth={2} />
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="catalog-filters__fields">
                <fieldset className="catalog-filters__group">
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Marca
                  </legend>
                  <details
                    className="catalog-filters__details"
                    onToggle={(event) =>
                      setIsSortSectionOpen(event.currentTarget.open)
                    }
                    open={isSortSectionOpen}
                    ref={sortDetailsRef}
                  >
                    <summary className="catalog-filters__summary">
                      <span>Marca</span>
                    </summary>
                    <div className="catalog-filters__option-list catalog-filters__option-list--scroll">
                      <FilterOption
                        defaultChecked={state.brand === ""}
                        label="Todos los productos"
                        name="brand"
                        value=""
                      />
                      {options.brands.map((brand) => (
                        <FilterOption
                          defaultChecked={state.brand === brand.slug}
                          key={brand.id}
                          label={brand.name}
                          name="brand"
                          value={brand.slug}
                        />
                      ))}
                    </div>
                  </details>
                </fieldset>

                <fieldset className="catalog-filters__group">
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Categoria
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Categoria</span>
                    </summary>
                    <div className="catalog-filters__option-list catalog-filters__option-list--scroll">
                      <FilterOption
                        defaultChecked={state.category === ""}
                        label="Todos los productos"
                        name="category"
                        onChange={() => setSelectedCategorySlug("")}
                        value=""
                      />
                      {options.categories.map((category) => (
                        <FilterOption
                          defaultChecked={state.category === category.slug}
                          key={category.id}
                          label={category.name}
                          name="category"
                          onChange={() => setSelectedCategorySlug(category.slug)}
                          value={category.slug}
                        />
                      ))}
                    </div>
                  </details>
                </fieldset>

                <fieldset className="catalog-filters__group" key={selectedCategorySlug}>
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Talle
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Talle</span>
                    </summary>
                    <div className="catalog-filters__details-body">
                      <div className="catalog-filters__option-list catalog-filters__option-list--sizes catalog-filters__option-list--size-all">
                        <FilterOption
                          defaultChecked={effectiveSelectedSize === ""}
                          label="Todos los productos"
                          name="size"
                          value=""
                        />
                      </div>
                      {letterSizes.length > 0 ? (
                        <SizeOptionGroup
                          name="size"
                          selectedSize={effectiveSelectedSize}
                          sizes={letterSizes}
                        />
                      ) : null}
                      {numericSizes.length > 0 ? (
                        <SizeOptionGroup
                          name="size"
                          selectedSize={effectiveSelectedSize}
                          sizes={numericSizes}
                        />
                      ) : null}
                    </div>
                  </details>
                </fieldset>

                <fieldset className="catalog-filters__group catalog-filters__group--sort">
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Ordenar
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Ordenar</span>
                    </summary>
                    <div className="catalog-filters__option-list">
                      {getSortOptions().map((option) => (
                        <FilterOption
                          defaultChecked={state.sort === option.value}
                          key={option.value}
                          label={option.label}
                          name="sort"
                          value={option.value}
                        />
                      ))}
                    </div>
                  </details>
                </fieldset>
              </div>

              <div className="catalog-filters__actions">
                {hasActiveControls ? (
                  <Link className="button button--ghost catalog-filters__clear" href="/">
                    Limpiar
                  </Link>
                ) : (
                  <button
                    className="button button--ghost catalog-filters__clear"
                    disabled
                    type="button"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  aria-busy={isApplying}
                  className="button button--primary catalog-filters__apply"
                  disabled={isApplying}
                  type="submit"
                >
                  {isApplying ? (
                    <>
                      <span
                        className="catalog-filters__apply-spinner"
                        aria-hidden="true"
                      />
                      Aplicando...
                    </>
                  ) : (
                    "Aplicar filtros"
                  )}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

type SizeOptionGroupProps = {
  name: string;
  selectedSize: string;
  sizes: CatalogSize[];
};

function SizeOptionGroup({
  name,
  selectedSize,
  sizes,
}: SizeOptionGroupProps) {
  return (
    <div className="catalog-filters__size-group">
      <div className="catalog-filters__option-list catalog-filters__option-list--sizes">
        {sizes.map((size) => (
          <FilterOption
            defaultChecked={selectedSize === size.value}
            key={size.id}
            label={size.label}
            name={name}
            value={size.value}
          />
        ))}
      </div>
    </div>
  );
}

type FilterOptionProps = {
  defaultChecked: boolean;
  label: string;
  name: string;
  onChange?: () => void;
  value: string;
};

function FilterOption({
  defaultChecked,
  label,
  name,
  onChange,
  value,
}: FilterOptionProps) {
  return (
    <label className="catalog-filters__option">
      <input
        className="catalog-filters__option-input"
        defaultChecked={defaultChecked}
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span className="catalog-filters__option-label">{label}</span>
    </label>
  );
}

function getAvailableSizes(
  options: CatalogOptions,
  selectedCategorySlug: string,
) {
  if (!selectedCategorySlug) {
    return options.sizes;
  }

  const selectedCategory = options.categories.find(
    (category) => category.slug === selectedCategorySlug,
  );

  if (!selectedCategory) {
    return options.sizes;
  }

  const allowedGroups = new Set<string>();

  if (selectedCategory.sizes_letter_enabled) {
    allowedGroups.add("letter");
  }

  if (selectedCategory.sizes_numeric_enabled) {
    allowedGroups.add("numeric");
  }

  if (allowedGroups.size === 0) {
    return [];
  }

  return options.sizes.filter((size) => allowedGroups.has(size.size_group));
}

function getActiveItems(options: CatalogOptions, state: PublicCatalogState) {
  const items: Array<{ href: string; key: string; label: string }> = [];
  const selectedBrand = options.brands.find((brand) => brand.slug === state.brand);
  const selectedCategory = options.categories.find(
    (category) => category.slug === state.category,
  );
  const selectedSize = options.sizes.find((size) => size.value === state.size);

  if (selectedBrand) {
    items.push({
      href: createPublicCatalogHref({ ...state, brand: "", page: 1 }),
      key: "brand",
      label: selectedBrand.name,
    });
  }

  if (selectedCategory) {
    items.push({
      href: createPublicCatalogHref({
        ...state,
        category: "",
        page: 1,
        size: "",
      }),
      key: "category",
      label: selectedCategory.name,
    });
  }

  if (selectedSize) {
    items.push({
      href: createPublicCatalogHref({ ...state, page: 1, size: "" }),
      key: "size",
      label: `Talle ${selectedSize.label}`,
    });
  }

  if (state.sort !== DEFAULT_PUBLIC_PRODUCT_SORT) {
    items.push({
      href: createPublicCatalogHref({
        ...state,
        page: 1,
        sort: DEFAULT_PUBLIC_PRODUCT_SORT,
      }),
      key: "sort",
      label: getSortLabel(state.sort),
    });
  }

  return items;
}

function getSortOptions(): Array<{ label: string; value: PublicProductSort }> {
  return [
    { label: "Mas recientes", value: "newest" },
    { label: "Menor precio", value: "price_asc" },
    { label: "Mayor precio", value: "price_desc" },
  ];
}

function getSortLabel(sort: PublicProductSort) {
  return getSortOptions().find((option) => option.value === sort)?.label ?? "Mas recientes";
}
