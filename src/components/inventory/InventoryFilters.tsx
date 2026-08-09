"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import type { CatalogOptions } from "@/features/catalog-options/types";
import {
  formatInventoryCurrency,
  formatInventoryDate,
  getInventoryStatusLabel,
} from "@/features/inventory/formatters";
import type {
  InventoryListFilters,
  InventorySortOrder,
  InventoryStatusFilter,
  InventoryValueFilter,
} from "@/features/inventory/types";
import { formatProductPriceInput } from "@/features/products/form-validation";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type InventoryFiltersProps = {
  filters: InventoryListFilters;
  options: CatalogOptions;
};

type InventoryFilterChip = {
  href: string;
  key: keyof InventoryListFilters;
  label: string;
};

export function InventoryFilters({ filters, options }: InventoryFiltersProps) {
  const stateKey = getInventoryStateKey(filters);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSortSectionOpen, setIsSortSectionOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(() => ({
    state: filters,
    stateKey,
  }));
  const applyTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const filterFormRef = useRef<HTMLFormElement>(null);
  const sortDetailsRef = useRef<HTMLDetailsElement>(null);
  const pendingState = useMemo(
    () => (pendingDraft.stateKey === stateKey ? pendingDraft.state : filters),
    [filters, pendingDraft, stateKey],
  );
  const activeItems = useMemo(
    () => getActiveItems(options, filters),
    [filters, options],
  );
  const pendingItems = useMemo(
    () => getActiveItems(options, pendingState),
    [options, pendingState],
  );
  const hasPendingChanges = !areInventoryStatesEqual(filters, pendingState);
  const isApplyPending = isApplying && pendingDraft.stateKey === stateKey;
  const drawerItems = hasPendingChanges ? pendingItems : activeItems;
  const hasActiveControls = activeItems.length > 0;

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

    setPendingDraft({ state: filters, stateKey });
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
    }, 900);
  }

  function handleOptionChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;

    updatePendingState(name, value);
    closeOptionSection(event.currentTarget);
  }

  function handleTextChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.currentTarget;

    updatePendingState(
      name,
      name === "cost_min" || name === "cost_max"
        ? formatProductPriceInput(value)
        : value,
    );
  }

  function handleDateChange(_fieldName: string, value: string) {
    updatePendingState("date", value);
  }

  function updatePendingState(fieldName: string, value: string) {
    setPendingDraft((currentDraft) => {
      const currentState =
        currentDraft.stateKey === stateKey ? currentDraft.state : filters;
      const nextState = { ...currentState };

      if (fieldName === "q") {
        nextState.query = value;
      }

      if (fieldName === "status") {
        nextState.status = value as InventoryStatusFilter;
      }

      if (fieldName === "published") {
        nextState.published = value as InventoryListFilters["published"];
      }

      if (fieldName === "category") {
        nextState.categoryId = value;
      }

      if (fieldName === "brand") {
        nextState.brandId = value;
      }

      if (fieldName === "condition") {
        nextState.conditionId = value;
      }

      if (fieldName === "date") {
        nextState.purchaseDate = value;
      }

      if (fieldName === "cost_min") {
        nextState.costMin = formatProductPriceInput(value);
      }

      if (fieldName === "cost_max") {
        nextState.costMax = formatProductPriceInput(value);
      }

      if (fieldName === "value_type") {
        nextState.valueType = value as InventoryValueFilter;
      }

      if (fieldName === "sort") {
        nextState.sort = value as InventorySortOrder;
      }

      return { state: nextState, stateKey };
    });
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

  function handlePendingChipRemove(itemKey: keyof InventoryListFilters) {
    setPendingDraft((currentDraft) => {
      const currentState =
        currentDraft.stateKey === stateKey ? currentDraft.state : filters;

      return {
        state: resetInventoryFilterValue(currentState, itemKey),
        stateKey,
      };
    });
  }

  return (
    <section className="catalog-filters inventory-drawer-filters" aria-label="Controles del stock">
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
            aria-label="Filtros de stock"
            aria-modal="true"
            className="catalog-filters__drawer"
            data-state={isClosing ? "closing" : "open"}
            role="dialog"
          >
            <div className="catalog-filters__drawer-header">
              <div className="catalog-filters__drawer-title-row">
                <h2 className="catalog-filters__title">Filtros de stock</h2>
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
              action="/oldtimes-admin/stock"
              className="catalog-filters__form"
              onSubmit={handleFilterSubmit}
              ref={filterFormRef}
            >
              <div className="catalog-filters__fields">
                <FilterTextSection
                  label="Buscar"
                  name="q"
                  onChange={handleTextChange}
                  placeholder="Titulo, ID o descripcion"
                  value={pendingState.query}
                />

                <FilterRadioSection
                  label="Estado comercial"
                  name="status"
                  onChange={handleOptionChange}
                  options={[
                    { label: "Disponibles", value: "available" },
                    { label: "Todos", value: "all" },
                    { label: "Reservados", value: "reserved" },
                    { label: "Vendidos", value: "sold" },
                  ]}
                  value={pendingState.status}
                />

                <FilterRadioSection
                  label="Catalogo"
                  name="published"
                  onChange={handleOptionChange}
                  options={[
                    { label: "Todos", value: "all" },
                    { label: "Publicado en catalogo", value: "published" },
                    { label: "Sin publicar", value: "unpublished" },
                  ]}
                  value={pendingState.published}
                />

                <FilterRadioSection
                  label="Categoria"
                  name="category"
                  onChange={handleOptionChange}
                  options={[
                    { label: "Todas", value: "" },
                    ...options.categories.map((category) => ({
                      label: category.name,
                      value: category.id,
                    })),
                  ]}
                  scroll
                  value={pendingState.categoryId}
                />

                <FilterRadioSection
                  label="Marca"
                  name="brand"
                  onChange={handleOptionChange}
                  options={[
                    { label: "Todas", value: "" },
                    ...options.brands.map((brand) => ({
                      label: brand.name,
                      value: brand.id,
                    })),
                  ]}
                  scroll
                  value={pendingState.brandId}
                />

                <FilterRadioSection
                  label="Estado de prenda"
                  name="condition"
                  onChange={handleOptionChange}
                  options={[
                    { label: "Todos", value: "" },
                    ...options.conditions.map((condition) => ({
                      label: condition.name,
                      value: condition.id,
                    })),
                  ]}
                  scroll
                  value={pendingState.conditionId}
                />

                <fieldset className="catalog-filters__group">
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Fecha de compra
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Fecha de compra</span>
                    </summary>
                    <div className="catalog-filters__details-body inventory-drawer-filters__body">
                      <DatePicker
                        defaultValue={pendingState.purchaseDate}
                        id="inventory-filter-date"
                        key={pendingState.purchaseDate}
                        name="date"
                        onChange={handleDateChange}
                      />
                    </div>
                  </details>
                </fieldset>

                <fieldset className="catalog-filters__group">
                  <legend className="catalog-filters__legend catalog-filters__legend--hidden">
                    Costos
                  </legend>
                  <details className="catalog-filters__details">
                    <summary className="catalog-filters__summary">
                      <span>Costos</span>
                    </summary>
                    <div className="catalog-filters__details-body inventory-drawer-filters__price-grid">
                      <label className="inventory-drawer-filters__price-type">
                        <span>Aplicar a</span>
                        <select
                          name="value_type"
                          onChange={(event) =>
                            updatePendingState(
                              event.currentTarget.name,
                              event.currentTarget.value,
                            )
                          }
                          value={pendingState.valueType}
                        >
                          <option value="purchase">Costo</option>
                          <option value="estimated">Venta estimada</option>
                          <option value="sale">Venta real</option>
                        </select>
                      </label>
                      <label>
                        <span>Desde</span>
                        <input
                          inputMode="numeric"
                          name="cost_min"
                          onChange={handleTextChange}
                          placeholder="$0"
                          type="text"
                          value={pendingState.costMin}
                        />
                      </label>
                      <label>
                        <span>Hasta</span>
                        <input
                          inputMode="numeric"
                          name="cost_max"
                          onChange={handleTextChange}
                          placeholder="$300.000"
                          type="text"
                          value={pendingState.costMax}
                        />
                      </label>
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
                          onChange={handleOptionChange}
                          value={option.value}
                        />
                      ))}
                    </div>
                  </details>
                </fieldset>
              </div>

              <div className="catalog-filters__actions">
                {hasActiveControls ? (
                  <Link className="button button--ghost catalog-filters__clear" href="/oldtimes-admin/stock">
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

type FilterRadioSectionProps = {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  scroll?: boolean;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function FilterRadioSection({
  label,
  name,
  onChange,
  options,
  scroll = false,
  value,
}: FilterRadioSectionProps) {
  return (
    <fieldset className="catalog-filters__group">
      <legend className="catalog-filters__legend catalog-filters__legend--hidden">
        {label}
      </legend>
      <details className="catalog-filters__details">
        <summary className="catalog-filters__summary">
          <span>{label}</span>
        </summary>
        <div
          className={`catalog-filters__option-list${
            scroll ? " catalog-filters__option-list--scroll" : ""
          }`}
        >
          {options.map((option) => (
            <FilterOption
              checked={value === option.value}
              key={option.value || `${name}-all`}
              label={option.label}
              name={name}
              onChange={onChange}
              value={option.value}
            />
          ))}
        </div>
      </details>
    </fieldset>
  );
}

type FilterTextSectionProps = {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function FilterTextSection({
  label,
  name,
  onChange,
  placeholder,
  value,
}: FilterTextSectionProps) {
  return (
    <fieldset className="catalog-filters__group">
      <legend className="catalog-filters__legend catalog-filters__legend--hidden">
        {label}
      </legend>
      <details className="catalog-filters__details">
        <summary className="catalog-filters__summary">
          <span>{label}</span>
        </summary>
        <div className="catalog-filters__details-body inventory-drawer-filters__body">
          <input
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            type="search"
            value={value}
          />
        </div>
      </details>
    </fieldset>
  );
}

type FilterOptionProps = {
  checked: boolean;
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function FilterOption({
  checked,
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
        type="radio"
        value={value}
      />
      <span className="catalog-filters__option-label">{label}</span>
    </label>
  );
}

function getActiveItems(
  options: CatalogOptions,
  state: InventoryListFilters,
): InventoryFilterChip[] {
  const items: InventoryFilterChip[] = [];
  const selectedBrand = options.brands.find((brand) => brand.id === state.brandId);
  const selectedCategory = options.categories.find(
    (category) => category.id === state.categoryId,
  );
  const selectedCondition = options.conditions.find(
    (condition) => condition.id === state.conditionId,
  );

  if (state.query) {
    items.push({
      href: createInventoryStockHref({ ...state, query: "" }),
      key: "query",
      label: `Busqueda: ${state.query}`,
    });
  }

  if (state.status !== "available") {
    items.push({
      href: createInventoryStockHref({ ...state, status: "available" }),
      key: "status",
      label:
        state.status === "all" ? "Todos" : getInventoryStatusLabel(state.status),
    });
  }

  if (state.published !== "all") {
    items.push({
      href: createInventoryStockHref({ ...state, published: "all" }),
      key: "published",
      label:
        state.published === "published"
          ? "Publicado en catalogo"
          : "Sin publicar",
    });
  }

  if (selectedCategory) {
    items.push({
      href: createInventoryStockHref({ ...state, categoryId: "" }),
      key: "categoryId",
      label: selectedCategory.name,
    });
  }

  if (selectedBrand) {
    items.push({
      href: createInventoryStockHref({ ...state, brandId: "" }),
      key: "brandId",
      label: selectedBrand.name,
    });
  }

  if (selectedCondition) {
    items.push({
      href: createInventoryStockHref({ ...state, conditionId: "" }),
      key: "conditionId",
      label: selectedCondition.name,
    });
  }

  if (state.purchaseDate) {
    items.push({
      href: createInventoryStockHref({ ...state, purchaseDate: "" }),
      key: "purchaseDate",
      label: formatInventoryDate(state.purchaseDate),
    });
  }

  if (state.costMin) {
    items.push({
      href: createInventoryStockHref({ ...state, costMin: "" }),
      key: "costMin",
      label: `${getValueTypeLabel(state.valueType)} desde ${formatInventoryCurrency(Number(normalizeCost(state.costMin)))}`,
    });
  }

  if (state.costMax) {
    items.push({
      href: createInventoryStockHref({ ...state, costMax: "" }),
      key: "costMax",
      label: `${getValueTypeLabel(state.valueType)} hasta ${formatInventoryCurrency(Number(normalizeCost(state.costMax)))}`,
    });
  }

  if (state.sort !== "newest") {
    items.push({
      href: createInventoryStockHref({ ...state, sort: "newest" }),
      key: "sort",
      label: getSortLabel(state.sort),
    });
  }

  return items;
}

function createInventoryStockHref(state: InventoryListFilters) {
  const params = new URLSearchParams();

  if (state.query) {
    params.set("q", state.query);
  }

  if (state.status !== "available") {
    params.set("status", state.status);
  }

  if (state.published !== "all") {
    params.set("published", state.published);
  }

  if (state.categoryId) {
    params.set("category", state.categoryId);
  }

  if (state.brandId) {
    params.set("brand", state.brandId);
  }

  if (state.conditionId) {
    params.set("condition", state.conditionId);
  }

  if (state.purchaseDate) {
    params.set("date", state.purchaseDate);
  }

  if (state.costMin) {
    params.set("cost_min", normalizeCost(state.costMin));
  }

  if (state.costMax) {
    params.set("cost_max", normalizeCost(state.costMax));
  }

  if (state.valueType !== "purchase") {
    params.set("value_type", state.valueType);
  }

  if (state.sort !== "newest") {
    params.set("sort", state.sort);
  }

  const queryString = params.toString();

  return queryString ? `/oldtimes-admin/stock?${queryString}` : "/oldtimes-admin/stock";
}

function resetInventoryFilterValue(
  state: InventoryListFilters,
  itemKey: keyof InventoryListFilters,
) {
  return {
    ...state,
    [itemKey]:
      itemKey === "status"
        ? "available"
        : itemKey === "published"
          ? "all"
          : itemKey === "sort"
            ? "newest"
            : itemKey === "valueType"
              ? "purchase"
              : "",
  };
}

function getSortOptions(): Array<{ label: string; value: InventorySortOrder }> {
  return [
    { label: "Mas recientes", value: "newest" },
    { label: "Mas antiguos", value: "oldest" },
    { label: "Mayor costo", value: "cost_desc" },
    { label: "Menor costo", value: "cost_asc" },
    { label: "Mayor estimado", value: "estimated_desc" },
    { label: "Menor estimado", value: "estimated_asc" },
    { label: "Mayor venta real", value: "sale_desc" },
    { label: "Menor venta real", value: "sale_asc" },
  ];
}

function getSortLabel(sort: InventorySortOrder) {
  return getSortOptions().find((option) => option.value === sort)?.label ?? "";
}

function normalizeCost(value: string) {
  return value.replace(/\D/g, "");
}

function getValueTypeLabel(valueType: InventoryValueFilter) {
  if (valueType === "estimated") {
    return "Estimado";
  }

  if (valueType === "sale") {
    return "Venta real";
  }

  return "Costo";
}

function getInventoryStateKey(state: InventoryListFilters) {
  return [
    state.brandId,
    state.categoryId,
    state.conditionId,
    state.costMax,
    state.costMin,
    state.published,
    state.purchaseDate,
    state.query,
    state.sort,
    state.status,
    state.valueType,
  ].join("|");
}

function areInventoryStatesEqual(
  firstState: InventoryListFilters,
  secondState: InventoryListFilters,
) {
  return getInventoryStateKey(firstState) === getInventoryStateKey(secondState);
}
