"use client";

import type {
  CatalogOptions,
  CatalogSize,
} from "@/features/catalog-options/types";
import {
  createPublicCatalogHref,
  type PublicCatalogState,
  type PublicProductSort,
} from "@/features/products/public-filters";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
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
  const stateKey = getCatalogStateKey(state);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSortSectionOpen, setIsSortSectionOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(() => ({
    state: { ...state, page: 1 },
    stateKey,
  }));
  const applyTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const filterFormRef = useRef<HTMLFormElement>(null);
  const sortDetailsRef = useRef<HTMLDetailsElement>(null);
  const syncedState = useMemo(
    () => ({ ...state, page: 1 }),
    [state],
  );
  const pendingState = useMemo(
    () => (pendingDraft.stateKey === stateKey ? pendingDraft.state : syncedState),
    [pendingDraft, stateKey, syncedState],
  );
  const availableSizes = useMemo(
    () => getAvailableSizes(options, pendingState.category),
    [options, pendingState.category],
  );
  const activeItems = useMemo(
    () => getActiveItems(options, state),
    [options, state],
  );
  const pendingItems = useMemo(
    () => getActiveItems(options, pendingState),
    [options, pendingState],
  );
  const hasPendingChanges = !areCatalogStatesEqual(state, pendingState);
  const isApplyPending = isApplying && pendingDraft.stateKey === stateKey;
  const drawerItems = hasPendingChanges ? pendingItems : activeItems;
  const letterSizes = availableSizes.filter(
    (size) => size.size_group === "letter",
  );
  const numericSizes = availableSizes.filter(
    (size) => size.size_group === "numeric",
  );
  const isSelectedSizeAvailable = availableSizes.some(
    (size) => size.value === pendingState.size,
  );
  const effectiveSelectedSize = isSelectedSizeAvailable ? pendingState.size : "";

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

    const nextPendingState = { ...state, page: 1 };

    setPendingDraft({ state: nextPendingState, stateKey });
    setIsSortSectionOpen(section === "sort");
    setIsApplying(false);
    setIsClosing(false);
    setIsOpen(true);

    if (section === "sort" && sortDetailsRef.current) {
      sortDetailsRef.current.open = true;
    }
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    if (isApplyPending) {
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

  function handleFilterOptionChange(event: ChangeEvent<HTMLInputElement>) {
    const { checked, name, value } = event.currentTarget;

    setPendingDraft((currentDraft) => {
      const currentState =
        currentDraft.stateKey === stateKey
          ? currentDraft.state
          : syncedState;
      const nextState = {
        ...currentState,
        page: 1,
      };

      if (name === "brand") {
        return {
          state: {
            ...nextState,
            brand: value,
          },
          stateKey,
        };
      }

      if (name === "category") {
        const nextSizes = getAvailableSizes(options, value);
        const isCurrentSizeAvailable = nextSizes.some(
          (size) => size.value === currentState.size,
        );

        return {
          state: {
            ...nextState,
            category: value,
            size: isCurrentSizeAvailable ? currentState.size : "",
          },
          stateKey,
        };
      }

      if (name === "size") {
        return {
          state: {
            ...nextState,
            size: value,
          },
          stateKey,
        };
      }

      if (name === "exclusivos") {
        return {
          state: {
            ...nextState,
            exclusive: checked,
          },
          stateKey,
        };
      }

      if (name === "sort") {
        return {
          state: {
            ...nextState,
            sort: value as PublicProductSort,
          },
          stateKey,
        };
      }

      return { state: nextState, stateKey };
    });

    closeOptionSection(event.currentTarget);
  }

  function closeOptionSection(input: HTMLInputElement) {
    const details = input.closest("details");

    if (!details) {
      return;
    }

    details.open = false;

    if (details === sortDetailsRef.current) {
      setIsSortSectionOpen(false);
    }
  }

  function handlePendingChipRemove(itemKey: string) {
    setPendingDraft((currentDraft) => {
      const currentState =
        currentDraft.stateKey === stateKey
          ? currentDraft.state
          : syncedState;
      const nextState = {
        ...currentState,
        page: 1,
      };

      if (itemKey === "brand") {
        nextState.brand = "";
      }

      if (itemKey === "category") {
        nextState.category = "";
        nextState.size = "";
      }

      if (itemKey === "size") {
        nextState.size = "";
      }

      if (itemKey === "exclusive") {
        nextState.exclusive = false;
      }

      if (itemKey === "sort") {
        nextState.sort = "";
      }

      return { state: nextState, stateKey };
    });
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
          <SlidersHorizontal aria-hidden="true" size={12} strokeWidth={2} />
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
          <ArrowDownUp aria-hidden="true" size={12} strokeWidth={2} />
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
              <div className="catalog-filters__drawer-title-row">
                <h2 className="catalog-filters__title">Filtros</h2>
                <button
                  aria-label="Cerrar filtros"
                  className="catalog-filters__close"
                  onClick={closeFilters}
                  type="button"
                >
                  <X aria-hidden="true" size={18} strokeWidth={1.8} />
                </button>
              </div>
              <div
                className="catalog-filters__drawer-chips"
                aria-label={
                  hasPendingChanges
                    ? "Filtros pendientes"
                    : "Filtros seleccionados"
                }
                data-empty={drawerItems.length === 0}
              >
                {drawerItems.map((item) =>
                  hasPendingChanges ? (
                    <button
                      aria-label={`Quitar filtro pendiente ${item.label}`}
                      className="catalog-filters__drawer-chip catalog-filters__drawer-chip--pending"
                      key={item.key}
                      onClick={() => handlePendingChipRemove(item.key)}
                      type="button"
                    >
                      <span>{item.label}</span>
                      <X aria-hidden="true" size={11} strokeWidth={2} />
                    </button>
                  ) : (
                    <Link
                      className="catalog-filters__drawer-chip"
                      href={item.href}
                      key={item.key}
                    >
                      <span>{item.label}</span>
                      <X aria-hidden="true" size={12} strokeWidth={2} />
                    </Link>
                  ),
                )}
              </div>
            </div>

            <form
              action="/"
              className="catalog-filters__form"
              onSubmit={handleFilterSubmit}
              ref={filterFormRef}
            >
              <div className="catalog-filters__fields">
                <fieldset className="catalog-filters__group">
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Marca
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Marca</span>
                    </summary>
                    <div className="catalog-filters__option-list catalog-filters__option-list--scroll">
                      <FilterOption
                        checked={pendingState.brand === ""}
                        label="Todos los productos"
                        name="brand"
                        onChange={handleFilterOptionChange}
                        value=""
                      />
                      {options.brands.map((brand) => (
                        <FilterOption
                          checked={pendingState.brand === brand.slug}
                          key={brand.id}
                          label={brand.name}
                          name="brand"
                          onChange={handleFilterOptionChange}
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
                        checked={pendingState.category === ""}
                        label="Todos los productos"
                        name="category"
                        onChange={handleFilterOptionChange}
                        value=""
                      />
                      {options.categories.map((category) => (
                        <FilterOption
                          checked={pendingState.category === category.slug}
                          key={category.id}
                          label={category.name}
                          name="category"
                          onChange={handleFilterOptionChange}
                          value={category.slug}
                        />
                      ))}
                    </div>
                  </details>
                </fieldset>

                <fieldset className="catalog-filters__group" key={pendingState.category}>
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
                          checked={effectiveSelectedSize === ""}
                          label="Todos los productos"
                          name="size"
                          onChange={handleFilterOptionChange}
                          value=""
                        />
                      </div>
                      {letterSizes.length > 0 ? (
                        <SizeOptionGroup
                          name="size"
                          onChange={handleFilterOptionChange}
                          selectedSize={effectiveSelectedSize}
                          sizes={letterSizes}
                        />
                      ) : null}
                      {numericSizes.length > 0 ? (
                        <SizeOptionGroup
                          name="size"
                          onChange={handleFilterOptionChange}
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
                  <details
                    className="catalog-filters__details"
                    onToggle={(event) =>
                      setIsSortSectionOpen(event.currentTarget.open)
                    }
                    open={isSortSectionOpen}
                    ref={sortDetailsRef}
                  >
                    <summary className="catalog-filters__summary">
                      <span>Ordenar</span>
                    </summary>
                    <div className="catalog-filters__option-list">
                      <FilterOption
                        checked={pendingState.exclusive}
                        inputType="checkbox"
                        label="Exclusivos"
                        name="exclusivos"
                        onChange={handleFilterOptionChange}
                        value="1"
                      />
                      {getSortOptions().map((option) => (
                        <FilterOption
                          checked={pendingState.sort === option.value}
                          key={option.value}
                          label={option.label}
                          name="sort"
                          onChange={handleFilterOptionChange}
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
                  aria-busy={isApplyPending}
                  className="button button--primary catalog-filters__apply"
                  disabled={isApplyPending}
                  type="submit"
                >
                  {isApplyPending ? (
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedSize: string;
  sizes: CatalogSize[];
};

function SizeOptionGroup({
  name,
  onChange,
  selectedSize,
  sizes,
}: SizeOptionGroupProps) {
  return (
    <div className="catalog-filters__size-group">
      <div className="catalog-filters__option-list catalog-filters__option-list--sizes">
        {sizes.map((size) => (
          <FilterOption
            checked={selectedSize === size.value}
            key={size.id}
            label={size.label}
            name={name}
            onChange={onChange}
            value={size.value}
          />
        ))}
      </div>
    </div>
  );
}

type FilterOptionProps = {
  checked: boolean;
  inputType?: "checkbox" | "radio";
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function FilterOption({
  checked,
  inputType = "radio",
  label,
  name,
  onChange,
  value,
}: FilterOptionProps) {
  return (
    <label className="catalog-filters__option">
      <input
        checked={checked}
        className="catalog-filters__option-input"
        name={name}
        onChange={onChange}
        type={inputType}
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

  if (state.exclusive) {
    items.push({
      href: createPublicCatalogHref({ ...state, exclusive: false, page: 1 }),
      key: "exclusive",
      label: "Exclusivos",
    });
  }

  if (state.sort) {
    items.push({
      href: createPublicCatalogHref({
        ...state,
        page: 1,
        sort: "",
      }),
      key: "sort",
      label: getSortLabel(state.sort),
    });
  }

  return items;
}

function getSortOptions(): Array<{ label: string; value: PublicProductSort }> {
  return [
    { label: "Mayor precio", value: "price_desc" },
    { label: "Menor precio", value: "price_asc" },
  ];
}

function getSortLabel(sort: PublicProductSort) {
  return getSortOptions().find((option) => option.value === sort)?.label ?? "";
}

function getCatalogStateKey(state: PublicCatalogState) {
  return [
    state.brand,
    state.category,
    state.exclusive ? "1" : "0",
    state.size,
    state.sort,
  ].join("|");
}

function areCatalogStatesEqual(
  firstState: PublicCatalogState,
  secondState: PublicCatalogState,
) {
  return (
    firstState.brand === secondState.brand &&
    firstState.category === secondState.category &&
    firstState.exclusive === secondState.exclusive &&
    firstState.size === secondState.size &&
    firstState.sort === secondState.sort
  );
}
