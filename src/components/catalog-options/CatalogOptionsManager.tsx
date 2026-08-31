"use client";

import {
  createCatalogOption,
  deleteCatalogOption,
  setCatalogOptionStatus,
  updateCatalogOption,
  updateCatalogOptionPositions,
  updateCatalogSizePositions,
} from "@/features/catalog-options/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogOptionActionState,
  CatalogOptions,
  CatalogProductCondition,
  CatalogSizeGroup,
  CatalogSize,
  CatalogOptionUsage,
} from "@/features/catalog-options/types";
import type { CatalogOptionKind } from "@/features/catalog-options/validation";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { reorderItemsById } from "@/features/products/reorder-items";

type PendingCatalogMutation = {
  confirmLabel: string;
  description: string;
  execute: () => Promise<CatalogOptionActionState>;
  onRollback?: () => void;
  successTitle: string;
  title: string;
  variant?: "default" | "danger";
};

type CatalogMutationResult = {
  description: string;
  shouldRefresh: boolean;
  title: string;
  variant: ResultModalVariant;
};

function useCatalogMutationFlow() {
  const router = useRouter();
  const [pendingMutation, setPendingMutation] =
    useState<PendingCatalogMutation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CatalogMutationResult | null>(null);

  function requestMutation(mutation: PendingCatalogMutation) {
    setResult(null);
    setPendingMutation(mutation);
  }

  function cancelMutation() {
    pendingMutation?.onRollback?.();
    setPendingMutation(null);
  }

  async function handleConfirm() {
    if (!pendingMutation || isProcessing) {
      return;
    }

    const currentMutation = pendingMutation;
    setPendingMutation(null);
    setIsProcessing(true);

    try {
      const actionResult = await currentMutation.execute();

      if (!actionResult.success) {
        currentMutation.onRollback?.();
        setResult({
          description: actionResult.message,
          shouldRefresh: false,
          title: currentMutation.title,
          variant: "error",
        });
        return;
      }

      setResult({
        description: actionResult.message,
        shouldRefresh: true,
        title: currentMutation.successTitle,
        variant: "success",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCloseResult() {
    const shouldRefresh = result?.shouldRefresh === true;

    setResult(null);

    if (shouldRefresh) {
      router.refresh();
    }
  }

  return {
    handleCloseResult,
    handleConfirm,
    isProcessing,
    cancelMutation,
    pendingMutation,
    requestMutation,
    result,
  };
}

type CatalogOptionsManagerProps = {
  options: CatalogOptions;
};

export function CatalogOptionsManager({ options }: CatalogOptionsManagerProps) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: false,
    conditions: false,
    sizes: false,
  });
  const summaries = [
    getCatalogSectionSummary("Categorías", options.categories),
    getCatalogSectionSummary("Marcas", options.brands),
    getCatalogSectionSummary("Estados", options.conditions),
    getCatalogSectionSummary("Talles", options.sizes),
  ];

  return (
    <div className="catalog-options-admin">
      <div
        aria-label="Resumen de configuración"
        className="catalog-config-overview"
      >
        {summaries.map((summary) => (
          <article className="catalog-config-summary" key={summary.label}>
            <div className="catalog-config-summary__main">
              <span className="catalog-config-summary__label">
                {summary.label}
              </span>
              <strong className="catalog-config-summary__value">
                {summary.total}
              </strong>
            </div>
            <div className="catalog-config-summary__meta">
              <span>
                {getCatalogSummaryStatusText(summary.label, true, summary.active)}
              </span>
              <span>
                {getCatalogSummaryStatusText(summary.label, false, summary.inactive)}
              </span>
            </div>
            <small className="catalog-config-summary__usage">
              {summary.usage.products} catálogo ·{" "}
              {summary.usage.inventoryItems} stock
            </small>
          </article>
        ))}
      </div>

      <CatalogCollapsibleSection
        activeCount={summaries[0].active}
        description="Tipos de prenda disponibles para productos y filtros."
        inactiveCount={summaries[0].inactive}
        isOpen={openSections.categories}
        onToggle={() =>
          setOpenSections((currentValue) => ({
            ...currentValue,
            categories: !currentValue.categories,
          }))
        }
        content={
          <CatalogOptionSection
            kind="category"
            options={options.categories}
          />
        }
        title="Categorías"
        totalCount={summaries[0].total}
        usage={summaries[0].usage}
      />
      <CatalogCollapsibleSection
        activeCount={summaries[1].active}
        description="Marcas disponibles para cargar productos y filtrar el catálogo."
        inactiveCount={summaries[1].inactive}
        isOpen={openSections.brands}
        onToggle={() =>
          setOpenSections((currentValue) => ({
            ...currentValue,
            brands: !currentValue.brands,
          }))
        }
        content={<CatalogOptionSection kind="brand" options={options.brands} />}
        title="Marcas"
        totalCount={summaries[1].total}
        usage={summaries[1].usage}
      />
      <CatalogCollapsibleSection
        activeCount={summaries[2].active}
        description="Estados de conservación disponibles para cargar productos."
        inactiveCount={summaries[2].inactive}
        isOpen={openSections.conditions}
        onToggle={() =>
          setOpenSections((currentValue) => ({
            ...currentValue,
            conditions: !currentValue.conditions,
          }))
        }
        content={
          <CatalogOptionSection
            kind="condition"
            options={options.conditions}
          />
        }
        title="Estados"
        totalCount={summaries[2].total}
        usage={summaries[2].usage}
      />
      <CatalogCollapsibleSection
        activeCount={summaries[3].active}
        description="Talles disponibles para asociar a categorías."
        inactiveCount={summaries[3].inactive}
        isOpen={openSections.sizes}
        onToggle={() =>
          setOpenSections((currentValue) => ({
            ...currentValue,
            sizes: !currentValue.sizes,
          }))
        }
        content={<CatalogOptionSection kind="size" options={options.sizes} />}
        title="Talles"
        totalCount={summaries[3].total}
        usage={summaries[3].usage}
      />
    </div>
  );
}

function CatalogCollapsibleSection({
  activeCount,
  content,
  description,
  inactiveCount,
  isOpen,
  onToggle,
  title,
  totalCount,
  usage,
}: {
  activeCount: number;
  content: ReactNode;
  description: string;
  inactiveCount: number;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  totalCount: number;
  usage: CatalogOptionUsage;
}) {
  return (
    <section className="catalog-options-section" data-open={isOpen}>
      <button
        aria-expanded={isOpen}
        className="catalog-options-section__toggle"
        onClick={onToggle}
        type="button"
      >
        <span className="catalog-options-section__toggle-main">
          <span className="catalog-options-section__toggle-text">
            <strong className="catalog-options-section__title">
              {title}
            </strong>
            <span>{description}</span>
          </span>
          <span className="catalog-options-section__meta">
            <span>{activeCount}/{totalCount} activas</span>
            <span>{inactiveCount} inactivas</span>
            <span>{getUsageSummaryLabel(usage)}</span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`catalog-options-section__chevron${
            isOpen ? " catalog-options-section__chevron--open" : ""
          }`}
        />
      </button>

      <div
        aria-hidden={!isOpen}
        className="catalog-options-section__content"
        data-open={isOpen}
      >
        {content}
      </div>
    </section>
  );
}

type CatalogOption =
  | CatalogBrand
  | CatalogCategory
  | CatalogProductCondition
  | CatalogSize;

type CatalogSimpleOption = CatalogBrand | CatalogProductCondition;

type CatalogOptionSectionProps = {
  kind: CatalogOptionKind;
  options: CatalogOption[];
};

function CatalogOptionSection({ kind, options }: CatalogOptionSectionProps) {
  if (kind === "category") {
    const categories = options as CatalogCategory[];
    return (
      <CatalogCategorySection
        categories={categories}
        key={categories
          .map(
            (category) =>
              `${category.id}:${category.position}:${category.is_active}:${category.name}`,
          )
          .join("|")}
      />
    );
  }

  if (kind === "size") {
    return <CatalogSizeManager sizes={options as CatalogSize[]} />;
  }

  if (kind === "condition") {
    const conditions = options as CatalogProductCondition[];
    return (
      <CatalogConditionSection
        conditions={conditions}
        key={conditions
          .map(
            (condition) =>
              `${condition.id}:${condition.position}:${condition.is_active}:${condition.name}`,
          )
          .join("|")}
      />
    );
  }

  const brands = options as CatalogBrand[];
  return (
    <CatalogBrandSection
      brands={brands}
      key={brands
        .map(
          (brand) =>
            `${brand.id}:${brand.position}:${brand.is_active}:${brand.name}`,
        )
        .join("|")}
    />
  );
}

function CatalogCategorySection({
  categories,
}: {
  categories: CatalogCategory[];
}) {
  const {
    cancelMutation,
    handleCloseResult,
    handleConfirm,
    isProcessing,
    pendingMutation,
    requestMutation,
    result,
  } =
    useCatalogMutationFlow();
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<CatalogCategory[] | null>(
    null,
  );

  function handleCreateCategoryMutation(form: HTMLFormElement) {
    const formData = new FormData(form);

    requestMutation({
      confirmLabel: "Crear categoría",
      description:
        "Se guardará la nueva categoría con sus talles permitidos.",
      execute: async () => {
        const actionResult = await createCatalogOption("category", formData);
        if (actionResult.success) {
          form.reset();
        }
        return actionResult;
      },
      successTitle: "Categoría creada",
      title: "Crear categoría",
    });
  }

  function handleUpdateCategoryMutation(formData: FormData) {
    requestMutation({
      confirmLabel: "Guardar categoría",
      description: "Se actualizarán los datos de la categoría.",
      execute: () => updateCatalogOption("category", formData),
      successTitle: "Categoría guardada",
      title: "Guardar categoría",
    });
  }

  function handleToggleCategoryStatus(category: CatalogCategory) {
    const formData = new FormData();
    formData.set("id", category.id);
    formData.set("isActive", String(!category.is_active));

    requestMutation({
      confirmLabel: category.is_active ? "Desactivar categoría" : "Activar categoría",
      description: getStatusChangeDescription("category", category),
      execute: () => setCatalogOptionStatus("category", formData),
      successTitle: category.is_active ? "Categoría desactivada" : "Categoría activada",
      title: category.is_active ? "Desactivar categoría" : "Activar categoría",
      variant: category.is_active ? "danger" : "default",
    });
  }

  function handleDeleteCategory(category: CatalogCategory) {
    const formData = new FormData();
    formData.set("id", category.id);

    requestMutation({
      confirmLabel: "Eliminar categoría",
      description: getDeleteImpactDescription("category", category),
      execute: () => deleteCatalogOption("category", formData),
      successTitle: "Categoría eliminada",
      title: "Eliminar categoría",
      variant: "danger",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!isOrdering) {
      return;
    }

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const nextCategories = reorderItemsById(
      orderedCategories,
      String(active.id),
      String(over.id),
    );

    setOrderedCategories(nextCategories);
  }

  function handleStartOrdering() {
    setOrderSnapshot(orderedCategories);
    setIsOrdering(true);
  }

  function handleCancelOrdering() {
    if (orderSnapshot) {
      setOrderedCategories(orderSnapshot);
    }

    setOrderSnapshot(null);
    setIsOrdering(false);
  }

  function handleSaveOrder() {
    const previousCategories = orderSnapshot ?? categories;
    const nextCategories = orderedCategories;

    if (hasSameOrder(previousCategories, nextCategories)) {
      setOrderSnapshot(null);
      setIsOrdering(false);
      return;
    }

    setOrderSnapshot(null);
    setIsOrdering(false);

    requestMutation({
      confirmLabel: "Guardar orden",
      description:
        "Se guardará el nuevo orden de las categorías del catálogo.",
      execute: () =>
        updateCatalogOptionPositions(
          "category",
          nextCategories.map((category) => category.id),
        ),
      onRollback: () => {
        setOrderedCategories(previousCategories);
      },
      successTitle: "Orden de categorías guardado",
      title: "Guardar orden de categorías",
    });
  }

  return (
    <>
      <CatalogCategoryCreateForm onRequestMutation={handleCreateCategoryMutation} />

      {orderedCategories.length > 0 ? (
        <>
          <CatalogOrderToolbar
            hasChanges={!hasSameOrder(orderSnapshot ?? orderedCategories, orderedCategories)}
            isOrdering={isOrdering}
            itemCount={orderedCategories.length}
            onCancel={handleCancelOrdering}
            onSave={handleSaveOrder}
            onStart={handleStartOrdering}
          />
          <CatalogSortableCategoryList
            categories={orderedCategories}
            isOrdering={isOrdering}
            onDragEnd={handleDragEnd}
            onDelete={handleDeleteCategory}
            onRequestMutation={handleUpdateCategoryMutation}
            onToggleStatus={handleToggleCategoryStatus}
          />
        </>
      ) : (
        <p className="catalog-options-empty">No hay categorías cargadas.</p>
      )}

      <ConfirmDialog
        confirmLabel={pendingMutation?.confirmLabel ?? "Confirmar"}
        description={pendingMutation?.description ?? ""}
        isOpen={pendingMutation !== null}
        isPending={isProcessing}
        onCancel={cancelMutation}
        onConfirm={handleConfirm}
        title={pendingMutation?.title ?? ""}
        variant={pendingMutation?.variant ?? "default"}
      />
      <LoadingOverlay
        isVisible={isProcessing}
        message="Procesando cambios..."
      />
      <ResultModal
        autoCloseMs={8000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={handleCloseResult}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );
}

function CatalogSortableCategoryList({
  categories,
  isOrdering,
  onDragEnd,
  onDelete,
  onRequestMutation,
  onToggleStatus,
}: {
  categories: CatalogCategory[];
  isOrdering: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onDelete: (category: CatalogCategory) => void;
  onRequestMutation: (formData: FormData) => void;
  onToggleStatus: (category: CatalogCategory) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      id="catalog-categories-dnd"
      onDragEnd={onDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={categories.map((category) => category.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`catalog-options-list${
            isOrdering ? " catalog-options-list--ordering" : ""
          }`}
        >
          <CatalogConfigTableHead descriptorLabel="Talles" isOrdering={isOrdering} />
          {categories.map((category, index) => (
            <CatalogCategoryRow
              category={category}
              isOrdering={isOrdering}
              key={category.id}
              onDelete={onDelete}
              onRequestMutation={onRequestMutation}
              onToggleStatus={onToggleStatus}
              position={index + 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function CatalogCategoryCreateForm({
  onRequestMutation,
}: {
  onRequestMutation: (form: HTMLFormElement) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRequestMutation(event.currentTarget);
  }

  return (
    <form
      className="catalog-category-form catalog-create-card"
      onSubmit={handleSubmit}
    >
      <div className="catalog-create-card__intro">
        <strong>Nueva categoría</strong>
      </div>
      <label className="form-field">
        <span>Nombre</span>
        <input name="name" placeholder="Ej: Camperas" />
      </label>

      <div className="catalog-category-form__sizes">
        <span className="catalog-category-form__label">
          Talles permitidos
        </span>
        <p className="catalog-category-form__hint">
          Selecciona uno o los dos grupos que aplican a esta categoría.
        </p>
        <div className="catalog-category-form__checks">
          <label>
            <input name="sizesLetterEnabled" type="checkbox" />
            <span>Letras</span>
          </label>
          <label>
            <input name="sizesNumericEnabled" type="checkbox" />
            <span>Numéricos</span>
          </label>
        </div>
      </div>

      <button className="button button--primary" type="submit">
        Agregar categoría
      </button>
    </form>
  );
}

function CatalogConfigTableHead({
  descriptorLabel,
  isOrdering,
}: {
  descriptorLabel: string;
  isOrdering: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="catalog-config-table-head"
      data-ordering={isOrdering}
    >
      <span>Nombre</span>
      <span>{descriptorLabel}</span>
      <span>Catálogo</span>
      <span>Stock</span>
      <span>Estado</span>
      <span>Orden</span>
      {!isOrdering ? <span /> : null}
    </div>
  );
}

function CatalogCategoryRow({
  category,
  isOrdering,
  onDelete,
  onRequestMutation,
  onToggleStatus,
  position,
}: {
  category: CatalogCategory;
  isOrdering: boolean;
  onDelete: (category: CatalogCategory) => void;
  onRequestMutation: (formData: FormData) => void;
  onToggleStatus: (category: CatalogCategory) => void;
  position: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const usage = getCatalogOptionUsage(category);

  return (
    <>
      <article
        aria-label={
          isOrdering ? `Ordenar categoría ${category.name}` : undefined
        }
        className={`catalog-config-row${
          isDragging ? " catalog-config-row--dragging" : ""
        }`}
        data-ordering={isOrdering}
        data-status={category.is_active ? "active" : "inactive"}
        ref={setNodeRef}
        style={style}
        title={isOrdering ? "Arrastrar para ordenar" : undefined}
        {...(isOrdering ? attributes : {})}
        {...(isOrdering ? listeners : {})}
      >
        <span className="catalog-config-row__rail" aria-hidden="true" />

        <div className="catalog-config-row__identity">
          <span>Categoría</span>
          <strong>{category.name}</strong>
        </div>

        <dl className="catalog-config-row__data">
          <div>
            <dt>Talles</dt>
            <dd>{getCategorySizeGroupsLabel(category)}</dd>
          </div>
          <div>
            <dt>Catálogo</dt>
            <dd>{usage.products}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>{usage.inventoryItems}</dd>
          </div>
        </dl>

        <CatalogRowStatus isActive={category.is_active} kind="category" />
        <span className="catalog-config-row__order">#{position}</span>
        {!isOrdering ? (
          <CatalogActionsMenu
            deleteLabel="Eliminar categoría"
            editLabel="Editar categoría"
            onDelete={() => onDelete(category)}
            onEdit={() => setIsEditing(true)}
            onToggleStatus={() => onToggleStatus(category)}
            statusLabel={
              category.is_active ? "Desactivar categoría" : "Activar categoría"
            }
          />
        ) : null}
      </article>

      <CatalogOptionEditModal
        kind="category"
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={(formData) => {
          setIsEditing(false);
          onRequestMutation(formData);
        }}
        option={category}
      />
    </>
  );
}

function CatalogBrandSection({ brands }: { brands: CatalogBrand[] }) {
  const {
    cancelMutation,
    handleCloseResult,
    handleConfirm,
    isProcessing,
    pendingMutation,
    requestMutation,
    result,
  } = useCatalogMutationFlow();
  const [orderedBrands, setOrderedBrands] = useState(brands);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<CatalogBrand[] | null>(
    null,
  );

  function handleCreateBrandMutation(form: HTMLFormElement) {
    const formData = new FormData(form);

    requestMutation({
      confirmLabel: "Crear marca",
      description: "Se guardará la nueva marca en el catálogo.",
      execute: async () => {
        const result = await createCatalogOption("brand", formData);
        if (result.success) {
          form.reset();
        }
        return result;
      },
      successTitle: "Marca creada",
      title: "Crear marca",
    });
  }

  function handleUpdateBrandMutation(formData: FormData) {
    requestMutation({
      confirmLabel: "Guardar marca",
      description: "Se actualizarán los datos de la marca.",
      execute: () => updateCatalogOption("brand", formData),
      successTitle: "Marca guardada",
      title: "Guardar marca",
    });
  }

  function handleToggleBrandStatus(brand: CatalogBrand) {
    const formData = new FormData();
    formData.set("id", brand.id);
    formData.set("isActive", String(!brand.is_active));

    requestMutation({
      confirmLabel: brand.is_active ? "Desactivar marca" : "Activar marca",
      description: getStatusChangeDescription("brand", brand),
      execute: () => setCatalogOptionStatus("brand", formData),
      successTitle: brand.is_active ? "Marca desactivada" : "Marca activada",
      title: brand.is_active ? "Desactivar marca" : "Activar marca",
      variant: brand.is_active ? "danger" : "default",
    });
  }

  function handleDeleteBrand(brand: CatalogBrand) {
    const formData = new FormData();
    formData.set("id", brand.id);

    requestMutation({
      confirmLabel: "Eliminar marca",
      description: getDeleteImpactDescription("brand", brand),
      execute: () => deleteCatalogOption("brand", formData),
      successTitle: "Marca eliminada",
      title: "Eliminar marca",
      variant: "danger",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!isOrdering) {
      return;
    }

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const nextBrands = reorderItemsById(
      orderedBrands,
      String(active.id),
      String(over.id),
    );

    setOrderedBrands(nextBrands);
  }

  function handleStartOrdering() {
    setOrderSnapshot(orderedBrands);
    setIsOrdering(true);
  }

  function handleCancelOrdering() {
    if (orderSnapshot) {
      setOrderedBrands(orderSnapshot);
    }

    setOrderSnapshot(null);
    setIsOrdering(false);
  }

  function handleSaveOrder() {
    const previousBrands = orderSnapshot ?? brands;
    const nextBrands = orderedBrands;

    if (hasSameOrder(previousBrands, nextBrands)) {
      setOrderSnapshot(null);
      setIsOrdering(false);
      return;
    }

    setOrderSnapshot(null);
    setIsOrdering(false);

    requestMutation({
      confirmLabel: "Guardar orden",
      description: "Se guardará el nuevo orden de las marcas del catálogo.",
      execute: () =>
        updateCatalogOptionPositions(
          "brand",
          nextBrands.map((brand) => brand.id),
        ),
      onRollback: () => {
        setOrderedBrands(previousBrands);
      },
      successTitle: "Orden de marcas guardado",
      title: "Guardar orden de marcas",
    });
  }

  return (
    <>
      <CatalogOptionCreateForm
        kind="brand"
        onRequestMutation={handleCreateBrandMutation}
      />

      {orderedBrands.length > 0 ? (
        <>
          <CatalogOrderToolbar
            hasChanges={!hasSameOrder(orderSnapshot ?? orderedBrands, orderedBrands)}
            isOrdering={isOrdering}
            itemCount={orderedBrands.length}
            onCancel={handleCancelOrdering}
            onSave={handleSaveOrder}
            onStart={handleStartOrdering}
          />
          <CatalogSortableBrandList
            brands={orderedBrands}
            isOrdering={isOrdering}
            onDragEnd={handleDragEnd}
            onDelete={handleDeleteBrand}
            onRequestMutation={handleUpdateBrandMutation}
            onToggleStatus={handleToggleBrandStatus}
          />
        </>
      ) : (
        <p className="catalog-options-empty">No hay marcas cargadas.</p>
      )}

      <ConfirmDialog
        confirmLabel={pendingMutation?.confirmLabel ?? "Confirmar"}
        description={pendingMutation?.description ?? ""}
        isOpen={pendingMutation !== null}
        isPending={isProcessing}
        onCancel={cancelMutation}
        onConfirm={handleConfirm}
        title={pendingMutation?.title ?? ""}
        variant={pendingMutation?.variant ?? "default"}
      />
      <LoadingOverlay
        isVisible={isProcessing}
        message="Procesando cambios..."
      />
      <ResultModal
        autoCloseMs={8000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={handleCloseResult}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );
}

function CatalogSortableBrandList({
  brands,
  isOrdering,
  onDragEnd,
  onDelete,
  onRequestMutation,
  onToggleStatus,
}: {
  brands: CatalogBrand[];
  isOrdering: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onDelete: (brand: CatalogBrand) => void;
  onRequestMutation: (formData: FormData) => void;
  onToggleStatus: (brand: CatalogBrand) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      id="catalog-brands-dnd"
      onDragEnd={onDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={brands.map((brand) => brand.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`catalog-options-list${
            isOrdering ? " catalog-options-list--ordering" : ""
          }`}
        >
          <CatalogConfigTableHead descriptorLabel="Tipo" isOrdering={isOrdering} />
          {brands.map((brand, index) => (
            <CatalogOptionRow
              isOrdering={isOrdering}
              kind="brand"
              key={brand.id}
              onDelete={(option) => onDelete(option as CatalogBrand)}
              onRequestMutation={onRequestMutation}
              onToggleStatus={(option) => onToggleStatus(option as CatalogBrand)}
              option={brand}
              position={index + 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function CatalogConditionSection({
  conditions,
}: {
  conditions: CatalogProductCondition[];
}) {
  const {
    cancelMutation,
    handleCloseResult,
    handleConfirm,
    isProcessing,
    pendingMutation,
    requestMutation,
    result,
  } = useCatalogMutationFlow();
  const [orderedConditions, setOrderedConditions] = useState(conditions);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<
    CatalogProductCondition[] | null
  >(null);

  function handleCreateConditionMutation(form: HTMLFormElement) {
    const formData = new FormData(form);

    requestMutation({
      confirmLabel: "Crear estado",
      description: "Se guardará el nuevo estado en el catálogo.",
      execute: async () => {
        const result = await createCatalogOption("condition", formData);
        if (result.success) {
          form.reset();
        }
        return result;
      },
      successTitle: "Estado creado",
      title: "Crear estado",
    });
  }

  function handleUpdateConditionMutation(formData: FormData) {
    requestMutation({
      confirmLabel: "Guardar estado",
      description: "Se actualizarán los datos del estado.",
      execute: () => updateCatalogOption("condition", formData),
      successTitle: "Estado guardado",
      title: "Guardar estado",
    });
  }

  function handleToggleConditionStatus(condition: CatalogProductCondition) {
    const formData = new FormData();
    formData.set("id", condition.id);
    formData.set("isActive", String(!condition.is_active));

    requestMutation({
      confirmLabel: condition.is_active ? "Desactivar estado" : "Activar estado",
      description: getStatusChangeDescription("condition", condition),
      execute: () => setCatalogOptionStatus("condition", formData),
      successTitle: condition.is_active ? "Estado desactivado" : "Estado activado",
      title: condition.is_active ? "Desactivar estado" : "Activar estado",
      variant: condition.is_active ? "danger" : "default",
    });
  }

  function handleDeleteCondition(condition: CatalogProductCondition) {
    const formData = new FormData();
    formData.set("id", condition.id);

    requestMutation({
      confirmLabel: "Eliminar estado",
      description: getDeleteImpactDescription("condition", condition),
      execute: () => deleteCatalogOption("condition", formData),
      successTitle: "Estado eliminado",
      title: "Eliminar estado",
      variant: "danger",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!isOrdering) {
      return;
    }

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const nextConditions = reorderItemsById(
      orderedConditions,
      String(active.id),
      String(over.id),
    );

    setOrderedConditions(nextConditions);
  }

  function handleStartOrdering() {
    setOrderSnapshot(orderedConditions);
    setIsOrdering(true);
  }

  function handleCancelOrdering() {
    if (orderSnapshot) {
      setOrderedConditions(orderSnapshot);
    }

    setOrderSnapshot(null);
    setIsOrdering(false);
  }

  function handleSaveOrder() {
    const previousConditions = orderSnapshot ?? conditions;
    const nextConditions = orderedConditions;

    if (hasSameOrder(previousConditions, nextConditions)) {
      setOrderSnapshot(null);
      setIsOrdering(false);
      return;
    }

    setOrderSnapshot(null);
    setIsOrdering(false);

    requestMutation({
      confirmLabel: "Guardar orden",
      description: "Se guardará el nuevo orden de los estados del catálogo.",
      execute: () =>
        updateCatalogOptionPositions(
          "condition",
          nextConditions.map((condition) => condition.id),
        ),
      onRollback: () => {
        setOrderedConditions(previousConditions);
      },
      successTitle: "Orden de estados guardado",
      title: "Guardar orden de estados",
    });
  }

  return (
    <>
      <CatalogOptionCreateForm
        kind="condition"
        onRequestMutation={handleCreateConditionMutation}
      />

      {orderedConditions.length > 0 ? (
        <>
          <CatalogOrderToolbar
            hasChanges={!hasSameOrder(orderSnapshot ?? orderedConditions, orderedConditions)}
            isOrdering={isOrdering}
            itemCount={orderedConditions.length}
            onCancel={handleCancelOrdering}
            onSave={handleSaveOrder}
            onStart={handleStartOrdering}
          />
          <CatalogSortableConditionList
            conditions={orderedConditions}
            isOrdering={isOrdering}
            onDragEnd={handleDragEnd}
            onDelete={handleDeleteCondition}
            onRequestMutation={handleUpdateConditionMutation}
            onToggleStatus={handleToggleConditionStatus}
          />
        </>
      ) : (
        <p className="catalog-options-empty">No hay estados cargados.</p>
      )}

      <ConfirmDialog
        confirmLabel={pendingMutation?.confirmLabel ?? "Confirmar"}
        description={pendingMutation?.description ?? ""}
        isOpen={pendingMutation !== null}
        isPending={isProcessing}
        onCancel={cancelMutation}
        onConfirm={handleConfirm}
        title={pendingMutation?.title ?? ""}
        variant={pendingMutation?.variant ?? "default"}
      />
      <LoadingOverlay
        isVisible={isProcessing}
        message="Procesando cambios..."
      />
      <ResultModal
        autoCloseMs={8000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={handleCloseResult}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );
}

function CatalogSortableConditionList({
  conditions,
  isOrdering,
  onDragEnd,
  onDelete,
  onRequestMutation,
  onToggleStatus,
}: {
  conditions: CatalogProductCondition[];
  isOrdering: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onDelete: (condition: CatalogProductCondition) => void;
  onRequestMutation: (formData: FormData) => void;
  onToggleStatus: (condition: CatalogProductCondition) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      id="catalog-conditions-dnd"
      onDragEnd={onDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={conditions.map((condition) => condition.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`catalog-options-list${
            isOrdering ? " catalog-options-list--ordering" : ""
          }`}
        >
          <CatalogConfigTableHead descriptorLabel="Tipo" isOrdering={isOrdering} />
          {conditions.map((condition, index) => (
            <CatalogOptionRow
              isOrdering={isOrdering}
              kind="condition"
              key={condition.id}
              onDelete={(option) =>
                onDelete(option as CatalogProductCondition)
              }
              onRequestMutation={onRequestMutation}
              onToggleStatus={(option) =>
                onToggleStatus(option as CatalogProductCondition)
              }
              option={condition}
              position={index + 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function CatalogSizeManager({ sizes }: { sizes: CatalogSize[] }) {
  const [selectedGroup, setSelectedGroup] = useState<CatalogSizeGroup | null>(
    null,
  );

  const groupedSizes = useMemo(() => {
    const groups: Record<CatalogSizeGroup, CatalogSize[]> = {
      letter: [],
      numeric: [],
    };

    for (const size of sizes) {
      groups[size.size_group].push(size);
    }

    return groups;
  }, [sizes]);

  return (
    <div className="catalog-size-manager">
      <div className="catalog-size-manager__selector">
        <button
          aria-pressed={selectedGroup === "letter"}
          className={`catalog-size-manager__toggle${
            selectedGroup === "letter"
              ? " catalog-size-manager__toggle--active"
              : ""
          }`}
          onClick={() => setSelectedGroup("letter")}
          type="button"
        >
          Letras
        </button>
        <button
          aria-pressed={selectedGroup === "numeric"}
          className={`catalog-size-manager__toggle${
            selectedGroup === "numeric"
              ? " catalog-size-manager__toggle--active"
              : ""
          }`}
          onClick={() => setSelectedGroup("numeric")}
          type="button"
        >
          Numéricos
        </button>
      </div>

      {selectedGroup ? (
        <div className="catalog-size-manager__groups">
          <CatalogSizeGroupPanel
            group={selectedGroup}
            key={`${selectedGroup}-${groupedSizes[selectedGroup]
              .map(
                (size) =>
                  `${size.id}:${size.position}:${size.is_active}:${size.size_group}`,
              )
              .join(",")}`}
            sizes={groupedSizes[selectedGroup]}
          />
        </div>
      ) : (
        <p className="catalog-options-empty">
          Selecciona Letras o Numéricos para trabajar con talles.
        </p>
      )}
    </div>
  );
}

function CatalogSizeGroupPanel({
  group,
  sizes,
}: {
  group: CatalogSizeGroup;
  sizes: CatalogSize[];
}) {
  const [orderedSizes, setOrderedSizes] = useState(sizes);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<CatalogSize[] | null>(
    null,
  );
  const {
    cancelMutation,
    handleCloseResult,
    handleConfirm,
    isProcessing,
    pendingMutation,
    requestMutation,
    result,
  } = useCatalogMutationFlow();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!isOrdering) {
      return;
    }

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedSizes.findIndex((size) => size.id === active.id);
    const newIndex = orderedSizes.findIndex((size) => size.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextValue = arrayMove(orderedSizes, oldIndex, newIndex);

    setOrderedSizes(nextValue);
  }

  function handleStartOrdering() {
    setOrderSnapshot(orderedSizes);
    setIsOrdering(true);
  }

  function handleCancelOrdering() {
    if (orderSnapshot) {
      setOrderedSizes(orderSnapshot);
    }

    setOrderSnapshot(null);
    setIsOrdering(false);
  }

  function handleSaveOrder() {
    const previousSizes = orderSnapshot ?? sizes;
    const nextValue = orderedSizes;

    if (hasSameOrder(previousSizes, nextValue)) {
      setOrderSnapshot(null);
      setIsOrdering(false);
      return;
    }

    setOrderSnapshot(null);
    setIsOrdering(false);

    requestMutation({
      confirmLabel: "Guardar orden",
      description:
        "Se guardará el nuevo orden de los talles de este grupo.",
      execute: () =>
        updateCatalogSizePositions(
          group,
          nextValue.map((size) => size.id),
        ),
      onRollback: () => {
        setOrderedSizes(previousSizes);
      },
      successTitle: "Orden de talles guardado",
      title: "Guardar orden de talles",
    });
  }

  return (
    <section className="catalog-size-group">
      <div className="catalog-size-group__header">
        <h3>
          {group === "letter" ? "Talles letra" : "Talles numéricos"}
        </h3>
        <span className="text-caption">{sizes.length} opciones</span>
      </div>

      <CatalogSizeCreateForm group={group} onRequestMutation={requestMutation} />

      {orderedSizes.length > 0 ? (
        <>
          <CatalogOrderToolbar
            hasChanges={!hasSameOrder(orderSnapshot ?? orderedSizes, orderedSizes)}
            isOrdering={isOrdering}
            itemCount={orderedSizes.length}
            onCancel={handleCancelOrdering}
            onSave={handleSaveOrder}
            onStart={handleStartOrdering}
          />
          <DndContext
            collisionDetection={closestCenter}
            id={`catalog-sizes-${group}-dnd`}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={orderedSizes.map((size) => size.id)}
              strategy={rectSortingStrategy}
            >
              <div
                className={`catalog-size-group__list catalog-options-list${
                  isOrdering ? " catalog-options-list--ordering" : ""
                }`}
              >
                <CatalogConfigTableHead descriptorLabel="Grupo" isOrdering={isOrdering} />
                {orderedSizes.map((option, index) => (
                  <CatalogSizeCard
                    group={group}
                    index={index}
                    isOrdering={isOrdering}
                    key={option.id}
                    onRequestMutation={requestMutation}
                    option={option}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <p className="catalog-options-empty">
          No hay talles {group === "letter" ? "de letras" : "numéricos"} cargados.
        </p>
      )}

      <ConfirmDialog
        confirmLabel={pendingMutation?.confirmLabel ?? "Confirmar"}
        description={pendingMutation?.description ?? ""}
        isOpen={pendingMutation !== null}
        isPending={isProcessing}
        onCancel={cancelMutation}
        onConfirm={handleConfirm}
        title={pendingMutation?.title ?? ""}
        variant={pendingMutation?.variant ?? "default"}
      />
      <LoadingOverlay
        isVisible={isProcessing}
        message="Procesando cambios..."
      />
      <ResultModal
        autoCloseMs={8000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={handleCloseResult}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </section>
  );
}

function CatalogSizeCreateForm({
  group,
  onRequestMutation,
}: {
  group: CatalogSizeGroup;
  onRequestMutation: (mutation: PendingCatalogMutation) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    onRequestMutation({
      confirmLabel: "Agregar talle",
      description: `Se agregará un nuevo talle al grupo ${group === "letter" ? "de letras" : "numérico"}.`,
      execute: async () => {
        const actionResult = await createCatalogOption("size", formData);
        if (actionResult.success) {
          form.reset();
        }
        return actionResult;
      },
      successTitle: "Talle creado",
      title: "Agregar talle",
    });
  }

  return (
    <form
      className="catalog-size-create catalog-create-card"
      onSubmit={handleSubmit}
    >
      <input name="sizeGroup" type="hidden" value={group} />
      <div className="catalog-create-card__intro">
        <strong>Nuevo talle</strong>
      </div>
      <label className="form-field">
        <span>Nombre</span>
        <input
          inputMode={group === "numeric" ? "numeric" : "text"}
          name="name"
          placeholder={group === "letter" ? "Ej: XL" : "Ej: 42"}
        />
      </label>
      <button className="button button--primary" type="submit">
        Agregar talle
      </button>
    </form>
  );
}

function CatalogSizeCard({
  group,
  index,
  isOrdering,
  option,
  onRequestMutation,
}: {
  group: CatalogSizeGroup;
  index: number;
  isOrdering: boolean;
  option: CatalogSize;
  onRequestMutation: (mutation: PendingCatalogMutation) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: option.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleStatusChange() {
    const formData = new FormData();
    formData.set("id", option.id);
    formData.set("isActive", String(!option.is_active));

    onRequestMutation({
      confirmLabel: option.is_active ? "Desactivar talle" : "Activar talle",
      description: getStatusChangeDescription("size", option),
      execute: () => setCatalogOptionStatus("size", formData),
      successTitle: option.is_active ? "Talle desactivado" : "Talle activado",
      title: option.is_active ? "Desactivar talle" : "Activar talle",
      variant: option.is_active ? "danger" : "default",
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", option.id);

    onRequestMutation({
      confirmLabel: "Eliminar talle",
      description: getDeleteImpactDescription("size", option),
      execute: () => deleteCatalogOption("size", formData),
      successTitle: "Talle eliminado",
      title: "Eliminar talle",
      variant: "danger",
    });
  }

  const usage = getCatalogOptionUsage(option);

  function handleUpdate(formData: FormData) {
    setIsEditing(false);
    onRequestMutation({
      confirmLabel: "Guardar talle",
      description: "Se actualizarán los datos del talle.",
      execute: () => updateCatalogOption("size", formData),
      successTitle: "Talle guardado",
      title: "Guardar talle",
    });
  }

  return (
    <>
      <article
        aria-label={isOrdering ? `Ordenar talle ${option.label}` : undefined}
        className={`catalog-config-row${
          isDragging ? " catalog-config-row--dragging" : ""
        }`}
        data-ordering={isOrdering}
        data-status={option.is_active ? "active" : "inactive"}
        ref={setNodeRef}
        style={style}
        title={isOrdering ? "Arrastrar para ordenar" : undefined}
        {...(isOrdering ? attributes : {})}
        {...(isOrdering ? listeners : {})}
      >
        <span className="catalog-config-row__rail" aria-hidden="true" />

        <div className="catalog-config-row__identity">
          <span>Talle</span>
          <strong>{option.label}</strong>
        </div>

        <dl className="catalog-config-row__data">
          <div>
            <dt>Grupo</dt>
            <dd>{group === "letter" ? "Letras" : "Numéricos"}</dd>
          </div>
          <div>
            <dt>Catálogo</dt>
            <dd>{usage.products}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>{usage.inventoryItems}</dd>
          </div>
        </dl>

        <CatalogRowStatus isActive={option.is_active} kind="size" />
        <span className="catalog-config-row__order">#{index + 1}</span>
        {!isOrdering ? (
          <CatalogActionsMenu
            deleteLabel="Eliminar talle"
            editLabel="Editar talle"
            onDelete={handleDelete}
            onEdit={() => setIsEditing(true)}
            onToggleStatus={handleStatusChange}
            statusLabel={option.is_active ? "Desactivar talle" : "Activar talle"}
          />
        ) : null}
      </article>

      <CatalogOptionEditModal
        kind="size"
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleUpdate}
        option={option}
      />
    </>
  );
}

function CatalogOptionCreateForm({
  kind,
  onRequestMutation,
}: {
  kind: Exclude<CatalogOptionKind, "size">;
  onRequestMutation: (form: HTMLFormElement) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRequestMutation(event.currentTarget);
  }

  return (
    <form
      className="catalog-option-create catalog-create-card"
      onSubmit={handleSubmit}
    >
      <div className="catalog-create-card__intro">
        <strong>{getCatalogOptionCreateLabel(kind)}</strong>
      </div>
      <label className="form-field">
        <span>Nombre</span>
        <input name="name" placeholder={getCatalogOptionPlaceholder(kind)} />
      </label>

      <button className="button button--primary" type="submit">
        {kind === "brand" ? "Agregar marca" : "Agregar estado"}
      </button>
    </form>
  );
}

function CatalogOptionRow({
  isOrdering,
  kind,
  onDelete,
  onRequestMutation,
  onToggleStatus,
  position,
  option,
}: {
  isOrdering: boolean;
  kind: Exclude<CatalogOptionKind, "size">;
  onDelete: (option: CatalogSimpleOption) => void;
  onRequestMutation: (formData: FormData) => void;
  onToggleStatus: (option: CatalogSimpleOption) => void;
  position: number;
  option: CatalogSimpleOption;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const label = getCatalogOptionDisplayName(kind, option);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: option.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const usage = getCatalogOptionUsage(option);

  return (
    <>
      <article
        aria-label={isOrdering ? `Ordenar ${label}` : undefined}
        className={`catalog-config-row${
          isDragging ? " catalog-config-row--dragging" : ""
        }`}
        data-ordering={isOrdering}
        data-status={option.is_active ? "active" : "inactive"}
        ref={setNodeRef}
        style={style}
        title={isOrdering ? "Arrastrar para ordenar" : undefined}
        {...(isOrdering ? attributes : {})}
        {...(isOrdering ? listeners : {})}
      >
        <span className="catalog-config-row__rail" aria-hidden="true" />

        <div className="catalog-config-row__identity">
          <span>{getCatalogOptionKindLabel(kind)}</span>
          <strong>{label}</strong>
        </div>

        <dl className="catalog-config-row__data">
          <div>
            <dt>Tipo</dt>
            <dd>{getCatalogOptionKindLabel(kind)}</dd>
          </div>
          <div>
            <dt>Catálogo</dt>
            <dd>{usage.products}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>{usage.inventoryItems}</dd>
          </div>
        </dl>

        <CatalogRowStatus isActive={option.is_active} kind={kind} />
        <span className="catalog-config-row__order">#{position}</span>
        {!isOrdering ? (
          <CatalogActionsMenu
            deleteLabel={`Eliminar ${label}`}
            editLabel={`Editar ${label}`}
            onDelete={() => onDelete(option)}
            onEdit={() => setIsEditing(true)}
            onToggleStatus={() => onToggleStatus(option)}
            statusLabel={
              option.is_active ? `Desactivar ${label}` : `Activar ${label}`
            }
          />
        ) : null}
      </article>

      <CatalogOptionEditModal
        kind={kind}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={(formData) => {
          setIsEditing(false);
          onRequestMutation(formData);
        }}
        option={option}
      />
    </>
  );
}

function CatalogRowStatus({
  isActive,
  kind,
}: {
  isActive: boolean;
  kind: CatalogOptionKind;
}) {
  return (
    <span
      className="catalog-config-row__status"
      data-status={isActive ? "active" : "inactive"}
    >
      <span aria-hidden="true" />
      {getCatalogOptionStatusLabel(kind, isActive)}
    </span>
  );
}

function CatalogActionsMenu({
  deleteLabel,
  editLabel,
  onDelete,
  onEdit,
  onToggleStatus,
  statusLabel,
}: {
  deleteLabel: string;
  editLabel: string;
  onDelete: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  statusLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleAction(action: () => void) {
    setIsOpen(false);
    action();
  }

  return (
    <div className="catalog-actions-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Abrir acciones"
        className="catalog-actions-menu__trigger"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        title="Acciones"
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={18} />
      </button>

      {isOpen ? (
        <div className="catalog-actions-menu__panel" role="menu">
          <button
            className="catalog-actions-menu__item"
            onClick={() => handleAction(onEdit)}
            role="menuitem"
            type="button"
          >
            <Pencil aria-hidden="true" size={15} />
            {editLabel}
          </button>
          <button
            className="catalog-actions-menu__item"
            onClick={() => handleAction(onToggleStatus)}
            role="menuitem"
            type="button"
          >
            <Power aria-hidden="true" size={15} />
            {statusLabel}
          </button>
          <button
            className="catalog-actions-menu__item catalog-actions-menu__item--danger"
            onClick={() => handleAction(onDelete)}
            role="menuitem"
            type="button"
          >
            <Trash2 aria-hidden="true" size={15} />
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CatalogOrderToolbar({
  hasChanges,
  isOrdering,
  itemCount,
  onCancel,
  onSave,
  onStart,
}: {
  hasChanges: boolean;
  isOrdering: boolean;
  itemCount: number;
  onCancel: () => void;
  onSave: () => void;
  onStart: () => void;
}) {
  return (
    <div className="catalog-order-toolbar" data-ordering={isOrdering}>
      <div>
        <strong>
          {isOrdering ? "Modo ordenar activo" : "Orden de visualización"}
        </strong>
        <span>
          {isOrdering
            ? "Arrastrá una fila completa para cambiar su posición. Guardá cuando termines."
            : "Activá el modo ordenar para reorganizar esta lista."}
        </span>
      </div>
      {isOrdering ? (
        <div className="catalog-order-toolbar__actions">
          <button
            className="catalog-order-toolbar__button catalog-order-toolbar__button--primary"
            disabled={!hasChanges}
            onClick={onSave}
            type="button"
          >
            Guardar cambios
          </button>
          <button
            className="catalog-order-toolbar__button catalog-order-toolbar__button--cancel"
            onClick={onCancel}
            type="button"
          >
            Cancelar orden
          </button>
        </div>
      ) : (
        <button
          className="catalog-order-toolbar__button catalog-order-toolbar__button--primary"
          disabled={itemCount < 2}
          onClick={onStart}
          type="button"
        >
          <ArrowUpDown aria-hidden="true" size={15} />
          Ordenar
        </button>
      )}
    </div>
  );
}

function CatalogOptionEditModal({
  isOpen,
  kind,
  onClose,
  onSubmit,
  option,
}: {
  isOpen: boolean;
  kind: CatalogOptionKind;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  option: CatalogOption;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const optionName = getCatalogOptionDisplayName(kind, option);
  const usage = getCatalogOptionUsage(option);
  const grammar = getCatalogOptionKindGrammar(kind);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="catalog-edit-modal" role="presentation">
      <button
        aria-label="Cerrar edición"
        className="catalog-edit-modal__backdrop"
        onClick={onClose}
        type="button"
      />
      <form
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="catalog-edit-modal__panel"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <div className="catalog-edit-modal__header">
          <span>{getCatalogOptionKindLabel(kind)}</span>
          <h2 id={titleId}>Editar {grammar.noun}</h2>
          <p id={descriptionId}>
            Actualizá los datos de <strong>{optionName}</strong>. Este cambio impacta en el
            catálogo y en el inventario.
          </p>
        </div>

        <div className="catalog-edit-modal__body">
          <input name="id" type="hidden" value={option.id} />
          <label className="form-field">
            <span>{getCatalogOptionKindLabel(kind)}</span>
            <input
              autoFocus
              defaultValue={optionName}
              name="name"
              placeholder={getCatalogOptionPlaceholder(kind)}
            />
          </label>

          {kind === "category" ? (
            <div className="catalog-edit-modal__field-group">
              <span>Talles permitidos</span>
              <p>
                Definen qué talles se pueden seleccionar al cargar productos de
                esta categoría.
              </p>
              <div className="catalog-category-form__checks">
                <label>
                  <input
                    defaultChecked={
                      (option as CatalogCategory).sizes_letter_enabled
                    }
                    name="sizesLetterEnabled"
                    type="checkbox"
                  />
                  <span>Letras</span>
                </label>
                <label>
                  <input
                    defaultChecked={
                      (option as CatalogCategory).sizes_numeric_enabled
                    }
                    name="sizesNumericEnabled"
                    type="checkbox"
                  />
                  <span>Numéricos</span>
                </label>
              </div>
            </div>
          ) : null}

          {kind === "size" ? (
            <label className="form-field">
              <span>Grupo</span>
              <select
                defaultValue={(option as CatalogSize).size_group}
                name="sizeGroup"
              >
                <option value="letter">Letras</option>
                <option value="numeric">Numéricos</option>
              </select>
            </label>
          ) : null}

          <div className="catalog-edit-modal__usage" aria-label="Uso actual">
            <span>{usage.products} en catálogo</span>
            <span>{usage.inventoryItems} en stock</span>
          </div>
        </div>

        <div className="catalog-edit-modal__actions">
          <button className="button button--secondary" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="button button--primary" type="submit">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

function getCatalogOptionDisplayName(
  kind: CatalogOptionKind,
  option: CatalogOption,
) {
  return kind === "size" ? (option as CatalogSize).label : (option as CatalogSimpleOption).name;
}

function getCatalogOptionPlaceholder(kind: CatalogOptionKind) {
  if (kind === "category") {
    return "Ej: Camperas";
  }

  if (kind === "brand") {
    return "Ej: Nike";
  }

  if (kind === "condition") {
    return "Ej: Muy bueno";
  }

  return "Ej: XL o 42";
}

function getCatalogOptionCreateLabel(kind: CatalogOptionKind) {
  if (kind === "brand") {
    return "Nueva marca";
  }

  if (kind === "condition") {
    return "Nuevo estado";
  }

  if (kind === "category") {
    return "Nueva categoría";
  }

  return "Nuevo talle";
}

function getCatalogSummaryStatusText(
  label: string,
  isActive: boolean,
  count: number,
) {
  const isFeminine = label === "Categorías" || label === "Marcas";
  const singular = isActive
    ? isFeminine
      ? "activa"
      : "activo"
    : isFeminine
      ? "inactiva"
      : "inactivo";

  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function getCatalogOptionKindLabel(kind: CatalogOptionKind) {
  if (kind === "brand") {
    return "Marca";
  }

  if (kind === "condition") {
    return "Estado";
  }

  if (kind === "category") {
    return "Categoría";
  }

  return "Talle";
}

function getCatalogOptionStatusLabel(
  kind: CatalogOptionKind,
  isActive: boolean,
) {
  if (kind === "brand" || kind === "category") {
    return isActive ? "Activa" : "Inactiva";
  }

  return isActive ? "Activo" : "Inactivo";
}

function hasSameOrder(
  previousOptions: Array<{ id: string }>,
  nextOptions: Array<{ id: string }>,
) {
  return (
    previousOptions.length === nextOptions.length &&
    previousOptions.every((option, index) => option.id === nextOptions[index]?.id)
  );
}

function getCatalogSectionSummary(label: string, options: CatalogOption[]) {
  return options.reduce(
    (summary, option) => {
      const usage = getCatalogOptionUsage(option);

      return {
        ...summary,
        active: summary.active + (option.is_active ? 1 : 0),
        inactive: summary.inactive + (option.is_active ? 0 : 1),
        total: summary.total + 1,
        usage: {
          inventoryItems: summary.usage.inventoryItems + usage.inventoryItems,
          products: summary.usage.products + usage.products,
        },
      };
    },
    {
      active: 0,
      inactive: 0,
      label,
      total: 0,
      usage: getEmptyCatalogUsage(),
    },
  );
}

function getStatusChangeDescription(
  kind: CatalogOptionKind,
  option: CatalogOption,
) {
  const grammar = getCatalogOptionKindGrammar(kind);
  const optionName = getCatalogOptionDisplayName(kind, option);
  const usage = getCatalogOptionUsage(option);

  if (!option.is_active) {
    return `${capitalizeFirst(grammar.article)} ${grammar.noun} "${optionName}" volverá a estar disponible en formularios, filtros y gestión de stock. ${getUsageImpactSentence(usage)}`;
  }

  return `${capitalizeFirst(grammar.article)} ${grammar.noun} "${optionName}" dejará de aparecer como opción nueva en formularios y filtros. Los registros existentes conservarán este dato. ${getUsageImpactSentence(usage)}`;
}

function getDeleteImpactDescription(
  kind: CatalogOptionKind,
  option: CatalogOption,
) {
  const grammar = getCatalogOptionKindGrammar(kind);
  const optionName = getCatalogOptionDisplayName(kind, option);
  const usage = getCatalogOptionUsage(option);
  const totalUsage = usage.products + usage.inventoryItems;

  if (totalUsage > 0) {
    return `${capitalizeFirst(grammar.article)} ${grammar.noun} "${optionName}" se usa actualmente en ${getUsageSummaryLabel(usage)}. Lo recomendable es marcar esta opción como inactiva; la eliminación no se completará mientras tenga referencias.`;
  }

  return `Se eliminará ${grammar.article} ${grammar.noun} "${optionName}". Esta acción conviene usarla solo para opciones creadas por error y sin uso.`;
}

function getUsageImpactSentence(usage: CatalogOptionUsage) {
  if (usage.products === 0 && usage.inventoryItems === 0) {
    return "Actualmente no tiene uso registrado.";
  }

  return `Uso actual: ${getUsageSummaryLabel(usage)}.`;
}

function getUsageSummaryLabel(usage: CatalogOptionUsage) {
  return `${usage.products} en catálogo · ${usage.inventoryItems} en stock`;
}

function getCatalogOptionUsage(option: CatalogOption): CatalogOptionUsage {
  return option.usage ?? getEmptyCatalogUsage();
}

function getEmptyCatalogUsage(): CatalogOptionUsage {
  return {
    inventoryItems: 0,
    products: 0,
  };
}

function getCatalogOptionKindGrammar(kind: CatalogOptionKind) {
  if (kind === "brand") {
    return {
      article: "la",
      noun: "marca",
    };
  }

  if (kind === "condition") {
    return {
      article: "el",
      noun: "estado",
    };
  }

  if (kind === "category") {
    return {
      article: "la",
      noun: "categoría",
    };
  }

  return {
    article: "el",
    noun: "talle",
  };
}

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCategorySizeGroupsLabel(category: CatalogCategory) {
  if (category.sizes_letter_enabled && category.sizes_numeric_enabled) {
    return "Letras y numéricos";
  }

  if (category.sizes_letter_enabled) {
    return "Letras";
  }

  if (category.sizes_numeric_enabled) {
    return "Numéricos";
  }

  return "Sin grupo activo";
}
