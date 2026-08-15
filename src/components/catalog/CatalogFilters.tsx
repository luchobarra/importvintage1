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
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

type CatalogFiltersProps = {
  hasActiveControls: boolean;
  options: CatalogOptions;
  state: PublicCatalogState;
};

const FILTER_ACTION_TIMEOUT_MS = 1400;

export function CatalogFilters({
  hasActiveControls,
  options,
  state,
}: CatalogFiltersProps) {
  const router = useRouter();
  const stateKey = getCatalogStateKey(state);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [processingAction, setProcessingAction] = useState<{
    stateKey: string;
    type: "apply" | "clear";
  } | null>(null);
  const [isSortSectionOpen, setIsSortSectionOpen] = useState(false);
  const [, startNavigationTransition] = useTransition();
  const [pendingDraft, setPendingDraft] = useState(() => ({
    state: { ...state, page: 1 },
    stateKey,
  }));
  const actionTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const navigationFrameRef = useRef<number | null>(null);
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
  const isProcessing = processingAction?.stateKey === stateKey;
  const isApplyPending = isProcessing && processingAction.type === "apply";
  const isClearPending = isProcessing && processingAction.type === "clear";
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

      if (actionTimeoutRef.current !== null) {
        window.clearTimeout(actionTimeoutRef.current);
      }

      if (navigationFrameRef.current !== null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
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
    setProcessingAction(null);
    setIsClosing(false);
    setIsOpen(true);

    if (section === "sort" && sortDetailsRef.current) {
      sortDetailsRef.current.open = true;
    }
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    if (isProcessing) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    processFilterAction("apply", createPublicCatalogHref(pendingState));
  }

  function handleClearFilters() {
    if (isProcessing || !hasActiveControls) {
      return;
    }

    processFilterAction(
      "clear",
      createPublicCatalogHref({
        ...state,
        brand: "",
        category: "",
        page: 1,
        size: "",
        sort: "",
      }),
    );
  }

  function processFilterAction(action: "apply" | "clear", href: string) {
    setProcessingAction({ stateKey, type: action });

    if (actionTimeoutRef.current !== null) {
      window.clearTimeout(actionTimeoutRef.current);
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      closeFilters();
    }, 520);

    actionTimeoutRef.current = window.setTimeout(() => {
      setProcessingAction(null);
      actionTimeoutRef.current = null;
    }, FILTER_ACTION_TIMEOUT_MS);

    navigationFrameRef.current = window.requestAnimationFrame(() => {
      startNavigationTransition(() => {
        router.push(href, { scroll: false });
        scrollToCatalogStart();
      });
      navigationFrameRef.current = null;
    });
  }

  function handleCatalogLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (isModifiedClick(event)) {
      return;
    }

    event.preventDefault();

    if (isOpen) {
      closeFilters();
    }

    startNavigationTransition(() => {
      router.push(href, { scroll: false });
      scrollToCatalogStart();
    });
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
    <section className="catalog-filters" aria-label="Controles del catálogo">
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
                onClick={(event) => handleCatalogLinkClick(event, item.href)}
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
            aria-label="Filtros del catálogo"
            aria-modal="true"
            className="catalog-filters__drawer"
            data-state={isClosing ? "closing" : "open"}
            role="dialog"
          >
              <div className="catalog-filters__drawer-header">
                <div className="catalog-filters__drawer-title-row">
                  <BrandLogo
                    className="catalog-filters__drawer-logo"
                    sizes="44px"
                  />
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
                      onClick={(event) =>
                        handleCatalogLinkClick(event, item.href)
                      }
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
                    Categoría
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Categoría</span>
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
                <button
                  aria-busy={isClearPending}
                  aria-label={isClearPending ? "Limpiando filtros" : undefined}
                  className="button button--ghost catalog-filters__clear"
                  disabled={isProcessing || !hasActiveControls}
                  onClick={handleClearFilters}
                  type="button"
                >
                  {isClearPending ? (
                    <span
                      className="catalog-filters__action-spinner"
                      aria-hidden="true"
                    />
                  ) : (
                    "Limpiar"
                  )}
                </button>
                <button
                  aria-busy={isApplyPending}
                  aria-label={isApplyPending ? "Aplicando filtros" : undefined}
                  className="button button--primary catalog-filters__apply"
                  disabled={isProcessing}
                  type="submit"
                >
                  {isApplyPending ? (
                    <span
                      className="catalog-filters__action-spinner"
                      aria-hidden="true"
                    />
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

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  );
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
