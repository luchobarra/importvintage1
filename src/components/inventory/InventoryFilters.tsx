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
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent, MouseEvent, ToggleEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

type InventoryFiltersProps = {
  filters: InventoryListFilters;
  options: CatalogOptions;
};

type InventoryFilterChip = {
  href: string;
  key: keyof InventoryListFilters;
  label: string;
};

const FILTER_ACTION_TIMEOUT_MS = 1400;
const DEFAULT_INVENTORY_FILTERS: InventoryListFilters = {
  brandId: "",
  categoryId: "",
  conditionId: "",
  costMax: "",
  costMin: "",
  published: "all",
  purchaseDate: "",
  query: "",
  sort: "newest",
  status: "available",
  valueType: "purchase",
};

export function InventoryFilters({ filters, options }: InventoryFiltersProps) {
  const router = useRouter();
  const activeItems = getActiveItems(options, filters);
  const hasActiveControls = activeItems.length > 0;
  const stateKey = getInventoryStateKey(filters);
  const [visualOverride, setVisualOverride] = useState<{
    filters: InventoryListFilters;
    stateKey: string;
  } | null>(null);
  const [processingAction, setProcessingAction] = useState<{
    stateKey: string;
    type: "apply" | "clear";
  } | null>(null);
  const [formResetIndex, setFormResetIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [, startNavigationTransition] = useTransition();
  const actionTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const navigationFrameRef = useRef<number | null>(null);
  const isProcessing = processingAction?.stateKey === stateKey;
  const isApplyPending = isProcessing && processingAction.type === "apply";
  const isClearPending = isProcessing && processingAction.type === "clear";
  const formFilters =
    visualOverride?.stateKey === stateKey ? visualOverride.filters : filters;
  const formKey = `${getInventoryStateKey(formFilters)}:${formResetIndex}`;

  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current !== null) {
        window.clearTimeout(actionTimeoutRef.current);
      }

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (navigationFrameRef.current !== null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        detailsRef.current &&
        event.target instanceof Node &&
        !detailsRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isProcessing) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setVisualOverride(null);
    processFilterAction(
      "apply",
      createInventoryStockHref(getFiltersFromForm(event.currentTarget)),
    );
  }

  function handleClearFilters() {
    if (isProcessing || !hasActiveControls) {
      return;
    }

    setVisualOverride({
      filters: DEFAULT_INVENTORY_FILTERS,
      stateKey,
    });
    processFilterAction("clear", "/retro-campus-admin/stock");
  }

  function handleRemoveFilter(
    event: MouseEvent<HTMLAnchorElement>,
    item: InventoryFilterChip,
  ) {
    if (isProcessing) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    const nextFilters = resetInventoryFilterValue(filters, item.key);

    setVisualOverride({
      filters: nextFilters,
      stateKey,
    });
    processFilterAction("apply", item.href);
  }

  function handlePriceInputChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = formatProductPriceInput(event.currentTarget.value);
  }

  function handleDropdownToggle(event: ToggleEvent<HTMLDetailsElement>) {
    const isOpen = event.currentTarget.open;

    setIsDropdownOpen(isOpen);

    if (!isOpen) {
      setFormResetIndex((currentIndex) => currentIndex + 1);
    }
  }

  function closeDropdown() {
    detailsRef.current?.removeAttribute("open");
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
      closeDropdown();
      closeTimeoutRef.current = null;
    }, 520);

    actionTimeoutRef.current = window.setTimeout(() => {
      setProcessingAction(null);
      actionTimeoutRef.current = null;
    }, FILTER_ACTION_TIMEOUT_MS);

    navigationFrameRef.current = window.requestAnimationFrame(() => {
      startNavigationTransition(() => {
        router.push(href, { scroll: false });
      });
      navigationFrameRef.current = null;
    });
  }

  return (
    <section className="inventory-control-panel" aria-label="Controles del stock">
      <div className="inventory-filter-dropdown__bar">
        <details
          className="inventory-filter-dropdown"
          onToggle={handleDropdownToggle}
          ref={detailsRef}
        >
          <summary className="inventory-filter-dropdown__trigger">
            <span>
              <SlidersHorizontal aria-hidden="true" size={14} />
              Filtros
            </span>
            <ChevronDown aria-hidden="true" size={16} />
          </summary>

          <div className="inventory-filter-dropdown__panel">
            <form
              action="/retro-campus-admin/stock"
              className="inventory-filter-dropdown__form"
              key={formKey}
              onSubmit={handleSubmit}
            >
            <div className="inventory-filter-dropdown__section">
              <div className="inventory-filter-dropdown__section-head">
                <p>Consulta rápida</p>
              </div>

              <div className="inventory-filter-dropdown__grid inventory-filter-dropdown__grid--core">
                <label className="inventory-filter-dropdown__search" htmlFor="inventory-search">
                  <span>Buscar</span>
                  <div>
                    <Search aria-hidden="true" size={16} />
                    <input
                      defaultValue={formFilters.query}
                      id="inventory-search"
                      name="q"
                      placeholder="Título, ID o descripción"
                      type="search"
                    />
                  </div>
                </label>

                <fieldset className="inventory-filter-dropdown__status">
                  <legend>Estado comercial</legend>
                  <div>
                    {getStatusOptions().map((option) => (
                      <label key={option.value}>
                        <input
                          defaultChecked={formFilters.status === option.value}
                          name="status"
                          type="radio"
                          value={option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <FilterSelect
                  defaultValue={formFilters.sort}
                  label="Orden"
                  name="sort"
                  options={getSortOptions()}
                />
              </div>
            </div>

            <div className="inventory-filter-dropdown__section">
              <div className="inventory-filter-dropdown__section-head">
                <p>Clasificación</p>
              </div>

              <div className="inventory-filter-dropdown__grid">
                <FilterSelect
                  defaultValue={formFilters.published}
                  label="Catálogo"
                  name="published"
                  options={[
                    { label: "Todos", value: "all" },
                    { label: "Publicado", value: "published" },
                    { label: "Sin publicar", value: "unpublished" },
                  ]}
                />
                <FilterSelect
                  defaultValue={formFilters.categoryId}
                  label="Categoría"
                  name="category"
                  options={[
                    { label: "Todas", value: "" },
                    ...options.categories.map((category) => ({
                      label: category.name,
                      value: category.id,
                    })),
                  ]}
                />
                <FilterSelect
                  defaultValue={formFilters.brandId}
                  label="Marca"
                  name="brand"
                  options={[
                    { label: "Todas", value: "" },
                    ...options.brands.map((brand) => ({
                      label: brand.name,
                      value: brand.id,
                    })),
                  ]}
                />
                <FilterSelect
                  defaultValue={formFilters.conditionId}
                  label="Estado de prenda"
                  name="condition"
                  options={[
                    { label: "Todos", value: "" },
                    ...options.conditions.map((condition) => ({
                      label: condition.name,
                      value: condition.id,
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="inventory-filter-dropdown__section">
              <div className="inventory-filter-dropdown__section-head">
                <p>Compra y valores</p>
              </div>

              <div className="inventory-filter-dropdown__grid inventory-filter-dropdown__grid--values">
                <label className="inventory-filter-dropdown__field" htmlFor="inventory-filter-date">
                  <span>Fecha de compra</span>
                  <DatePicker
                    defaultValue={formFilters.purchaseDate}
                    id="inventory-filter-date"
                    name="date"
                    placeholder="Cualquier fecha"
                  />
                </label>
                <FilterSelect
                  defaultValue={formFilters.valueType}
                  label="Valor"
                  name="value_type"
                  options={[
                    { label: "Costo", value: "purchase" },
                    { label: "Venta estimada", value: "estimated" },
                    { label: "Venta real", value: "sale" },
                  ]}
                />
                <label className="inventory-filter-dropdown__field" htmlFor="inventory-cost-min">
                  <span>Desde</span>
                  <input
                    defaultValue={formFilters.costMin}
                    id="inventory-cost-min"
                    inputMode="numeric"
                    name="cost_min"
                    onChange={handlePriceInputChange}
                    placeholder="$0"
                    type="text"
                  />
                </label>
                <label className="inventory-filter-dropdown__field" htmlFor="inventory-cost-max">
                  <span>Hasta</span>
                  <input
                    defaultValue={formFilters.costMax}
                    id="inventory-cost-max"
                    inputMode="numeric"
                    name="cost_max"
                    onChange={handlePriceInputChange}
                    placeholder="$300.000"
                    type="text"
                  />
                </label>
              </div>
            </div>

            <div className="inventory-filter-dropdown__actions">
              <button
                aria-busy={isClearPending}
                aria-label={isClearPending ? "Limpiando filtros" : undefined}
                className="button button--ghost catalog-filters__clear inventory-filter-dropdown__clear"
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
          </div>
        </details>

        {hasActiveControls ? (
          <span
            className="inventory-filter-dropdown__count"
            aria-label={`${activeItems.length} filtros activos`}
          >
            {activeItems.length}
          </span>
        ) : null}

        {hasActiveControls ? (
          <div className="inventory-filter-dropdown__chips" aria-label="Filtros activos">
            {activeItems.map((item) => (
              <Link
                href={item.href}
                key={item.key}
                onClick={(event) => handleRemoveFilter(event, item)}
              >
                <span>{item.label}</span>
                <X aria-hidden="true" size={12} strokeWidth={2} />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type FilterSelectProps = {
  className?: string;
  defaultValue: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
};

function FilterSelect({
  className = "",
  defaultValue,
  label,
  name,
  options,
}: FilterSelectProps) {
  return (
    <label className={`inventory-filter-dropdown__field ${className}`.trim()}>
      <span>{label}</span>
      <select defaultValue={defaultValue} name={name}>
        {options.map((option) => (
          <option key={option.value || `${name}-all`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getStatusOptions(): Array<{ label: string; value: InventoryStatusFilter }> {
  return [
    { label: "Disponibles", value: "available" },
    { label: "Todos", value: "all" },
    { label: "Reservados", value: "reserved" },
    { label: "Vendidos", value: "sold" },
  ];
}

function getFiltersFromForm(form: HTMLFormElement): InventoryListFilters {
  const formData = new FormData(form);

  return {
    brandId: String(formData.get("brand") ?? ""),
    categoryId: String(formData.get("category") ?? ""),
    conditionId: String(formData.get("condition") ?? ""),
    costMax: String(formData.get("cost_max") ?? ""),
    costMin: String(formData.get("cost_min") ?? ""),
    published: String(
      formData.get("published") ?? "all",
    ) as InventoryListFilters["published"],
    purchaseDate: String(formData.get("date") ?? ""),
    query: String(formData.get("q") ?? "").trim(),
    sort: String(formData.get("sort") ?? "newest") as InventorySortOrder,
    status: String(formData.get("status") ?? "available") as InventoryStatusFilter,
    valueType: String(formData.get("value_type") ?? "purchase") as InventoryValueFilter,
  };
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
      label: `Búsqueda: ${state.query}`,
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
      label: state.published === "published" ? "Publicado" : "Sin publicar",
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
    const hasRemainingCostFilter = Boolean(state.costMax);

    items.push({
      href: createInventoryStockHref({
        ...state,
        costMin: "",
        valueType: hasRemainingCostFilter ? state.valueType : "purchase",
      }),
      key: "costMin",
      label: `${getValueTypeLabel(state.valueType)} desde ${formatInventoryCurrency(Number(normalizeCost(state.costMin)))}`,
    });
  }

  if (state.costMax) {
    const hasRemainingCostFilter = Boolean(state.costMin);

    items.push({
      href: createInventoryStockHref({
        ...state,
        costMax: "",
        valueType: hasRemainingCostFilter ? state.valueType : "purchase",
      }),
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

  return queryString ? `/retro-campus-admin/stock?${queryString}` : "/retro-campus-admin/stock";
}

function getSortOptions(): Array<{ label: string; value: InventorySortOrder }> {
  return [
    { label: "Más recientes", value: "newest" },
    { label: "Más antiguos", value: "oldest" },
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

function resetInventoryFilterValue(
  state: InventoryListFilters,
  itemKey: keyof InventoryListFilters,
): InventoryListFilters {
  const nextState = {
    ...state,
    [itemKey]:
      itemKey === "status"
        ? DEFAULT_INVENTORY_FILTERS.status
        : itemKey === "published"
          ? DEFAULT_INVENTORY_FILTERS.published
          : itemKey === "sort"
            ? DEFAULT_INVENTORY_FILTERS.sort
            : itemKey === "valueType"
              ? DEFAULT_INVENTORY_FILTERS.valueType
              : "",
  };

  if (
    (itemKey === "costMin" && !state.costMax) ||
    (itemKey === "costMax" && !state.costMin)
  ) {
    nextState.valueType = DEFAULT_INVENTORY_FILTERS.valueType;
  }

  return nextState;
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
