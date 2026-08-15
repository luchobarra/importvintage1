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
import { GripVertical, Pencil, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useMemo,
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
    categories: false,
    brands: false,
    conditions: false,
    sizes: false,
  });

  return (
    <div className="catalog-options-admin">
      <CatalogCollapsibleSection
        description="Tipos de prenda disponibles para productos y filtros."
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
        title="Categorias"
      />
      <CatalogCollapsibleSection
        description="Marcas disponibles para cargar productos y filtrar el catálogo."
        isOpen={openSections.brands}
        onToggle={() =>
          setOpenSections((currentValue) => ({
            ...currentValue,
            brands: !currentValue.brands,
          }))
        }
        content={<CatalogOptionSection kind="brand" options={options.brands} />}
        title="Marcas"
      />
      <CatalogCollapsibleSection
        description="Estados de conservacion disponibles para cargar productos."
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
      />
      <CatalogCollapsibleSection
        description="Talles disponibles para asociar a categorias."
        isOpen={openSections.sizes}
        onToggle={() =>
          setOpenSections((currentValue) => ({
            ...currentValue,
            sizes: !currentValue.sizes,
          }))
        }
        content={<CatalogOptionSection kind="size" options={options.sizes} />}
        title="Talles"
      />
    </div>
  );
}

function CatalogCollapsibleSection({
  content,
  description,
  isOpen,
  onToggle,
  title,
}: {
  content: ReactNode;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className="catalog-options-section ui-panel">
      <button
        aria-expanded={isOpen}
        className="catalog-options-section__toggle"
        onClick={onToggle}
        type="button"
      >
        <span className="catalog-options-section__toggle-text">
          <strong className="text-h3">{title}</strong>
          <span className="text-body">{description}</span>
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
      description: category.is_active
        ? "La categoría dejara de estar disponible para productos y filtros."
        : "La categoría volvera a estar disponible para productos y filtros.",
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
      description:
        "Se eliminará la categoría si no está siendo usada por productos.",
      execute: () => deleteCatalogOption("category", formData),
      successTitle: "Categoría eliminada",
      title: "Eliminar categoría",
      variant: "danger",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const previousCategories = orderedCategories;
    const nextCategories = reorderItemsById(
      orderedCategories,
      String(active.id),
      String(over.id),
    );

    setOrderedCategories(nextCategories);

    requestMutation({
      confirmLabel: "Guardar orden",
      description:
        "Se guardará el nuevo orden de las categorias del catálogo.",
      execute: () =>
        updateCatalogOptionPositions(
          "category",
          nextCategories.map((category) => category.id),
        ),
      onRollback: () => setOrderedCategories(previousCategories),
      successTitle: "Orden de categorias guardado",
      title: "Guardar orden de categorias",
    });
  }

  return (
    <>
      <CatalogCategoryCreateForm onRequestMutation={handleCreateCategoryMutation} />

      {orderedCategories.length > 0 ? (
        <CatalogSortableCategoryList
          categories={orderedCategories}
          onDragEnd={handleDragEnd}
          onDelete={handleDeleteCategory}
          onRequestMutation={handleUpdateCategoryMutation}
          onToggleStatus={handleToggleCategoryStatus}
        />
      ) : (
        <p className="catalog-options-empty">No hay categorias cargadas.</p>
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
  onDragEnd,
  onDelete,
  onRequestMutation,
  onToggleStatus,
}: {
  categories: CatalogCategory[];
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
        <div className="catalog-options-list">
          {categories.map((category, index) => (
            <CatalogCategoryRow
              category={category}
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
    <form className="catalog-category-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Nueva categoría</span>
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
        Agregar
      </button>
    </form>
  );
}

function CatalogCategoryRow({
  category,
  onDelete,
  onRequestMutation,
  onToggleStatus,
  position,
}: {
  category: CatalogCategory;
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

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRequestMutation(new FormData(event.currentTarget));
  }

  return (
    <article
      className={`catalog-category-card${
        isDragging ? " catalog-category-card--dragging" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="catalog-category-card__summary">
        <div>
          <p className="catalog-config-pair">
            <span>Categoría:</span>
            <strong>{category.name}</strong>
          </p>
          <p className="catalog-config-pair catalog-config-pair--muted">
            <span>Talles:</span>
            <strong>{getCategorySizeGroupsLabel(category)}</strong>
          </p>
        </div>
        <div className="catalog-category-card__inline-actions">
          <button
            className="catalog-config-action"
            onClick={() => setIsEditing((currentValue) => !currentValue)}
            type="button"
          >
            <Pencil aria-hidden="true" size={14} />
            {isEditing ? "Cerrar" : "Editar"}
          </button>
          <button
            aria-label={`Mover categoría ${category.name}`}
            className="catalog-config-action catalog-config-action--drag catalog-category-card__drag"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden="true" size={15} />
            Mover
          </button>
          <button
            className="catalog-config-action"
            onClick={() => onToggleStatus(category)}
            type="button"
          >
            <Power aria-hidden="true" size={14} />
            {category.is_active ? "Desactivar" : "Activar"}
          </button>
          <button
            className="catalog-config-action catalog-config-action--danger"
            onClick={() => onDelete(category)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Eliminar
          </button>
          <span
            className={`catalog-option-order${
              category.is_active ? "" : " catalog-option-order--inactive"
            }`}
          >
            {category.is_active ? "Activo" : "Inactivo"} · Orden {position}
          </span>
        </div>
      </div>

      {isEditing ? (
        <form className="catalog-category-card__form" onSubmit={handleUpdate}>
          <input name="id" type="hidden" value={category.id} />
          <label className="form-field">
            <span>Categoría</span>
            <input defaultValue={category.name} name="name" />
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
                <input
                  defaultChecked={category.sizes_letter_enabled}
                  name="sizesLetterEnabled"
                  type="checkbox"
                />
                <span>Letras</span>
              </label>
              <label>
                <input
                  defaultChecked={category.sizes_numeric_enabled}
                  name="sizesNumericEnabled"
                  type="checkbox"
                />
                <span>Numéricos</span>
              </label>
            </div>
          </div>

          <div className="catalog-category-card__actions">
            <button className="button" type="submit">
              Guardar
            </button>
            <button
              className="button"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

    </article>
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
      description: brand.is_active
        ? "La marca dejara de estar disponible para productos y filtros."
        : "La marca volvera a estar disponible para productos y filtros.",
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
      description: "Se eliminará la marca si no está siendo usada por productos.",
      execute: () => deleteCatalogOption("brand", formData),
      successTitle: "Marca eliminada",
      title: "Eliminar marca",
      variant: "danger",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const previousBrands = orderedBrands;
    const nextBrands = reorderItemsById(
      orderedBrands,
      String(active.id),
      String(over.id),
    );

    setOrderedBrands(nextBrands);

    requestMutation({
      confirmLabel: "Guardar orden",
      description: "Se guardará el nuevo orden de las marcas del catálogo.",
      execute: () =>
        updateCatalogOptionPositions(
          "brand",
          nextBrands.map((brand) => brand.id),
        ),
      onRollback: () => setOrderedBrands(previousBrands),
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
        <CatalogSortableBrandList
          brands={orderedBrands}
          onDragEnd={handleDragEnd}
          onDelete={handleDeleteBrand}
          onRequestMutation={handleUpdateBrandMutation}
          onToggleStatus={handleToggleBrandStatus}
        />
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
  onDragEnd,
  onDelete,
  onRequestMutation,
  onToggleStatus,
}: {
  brands: CatalogBrand[];
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
        <div className="catalog-options-list">
          {brands.map((brand, index) => (
            <CatalogOptionRow
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
      description: condition.is_active
        ? "El estado dejara de estar disponible para cargar productos."
        : "El estado volvera a estar disponible para cargar productos.",
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
      description: "Se eliminará el estado si no está siendo usado por productos.",
      execute: () => deleteCatalogOption("condition", formData),
      successTitle: "Estado eliminado",
      title: "Eliminar estado",
      variant: "danger",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const previousConditions = orderedConditions;
    const nextConditions = reorderItemsById(
      orderedConditions,
      String(active.id),
      String(over.id),
    );

    setOrderedConditions(nextConditions);

    requestMutation({
      confirmLabel: "Guardar orden",
      description: "Se guardará el nuevo orden de los estados del catálogo.",
      execute: () =>
        updateCatalogOptionPositions(
          "condition",
          nextConditions.map((condition) => condition.id),
        ),
      onRollback: () => setOrderedConditions(previousConditions),
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
        <CatalogSortableConditionList
          conditions={orderedConditions}
          onDragEnd={handleDragEnd}
          onDelete={handleDeleteCondition}
          onRequestMutation={handleUpdateConditionMutation}
          onToggleStatus={handleToggleConditionStatus}
        />
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
  onDragEnd,
  onDelete,
  onRequestMutation,
  onToggleStatus,
}: {
  conditions: CatalogProductCondition[];
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
        <div className="catalog-options-list">
          {conditions.map((condition, index) => (
            <CatalogOptionRow
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
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedSizes.findIndex((size) => size.id === active.id);
    const newIndex = orderedSizes.findIndex((size) => size.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousSizes = orderedSizes;
    const nextValue = arrayMove(orderedSizes, oldIndex, newIndex);

    setOrderedSizes(nextValue);
    requestMutation({
      confirmLabel: "Guardar orden",
      description:
        "Se guardará el nuevo orden de los talles de este grupo.",
      execute: () =>
        updateCatalogSizePositions(
          group,
          nextValue.map((size) => size.id),
        ),
      onRollback: () => setOrderedSizes(previousSizes),
      successTitle: "Orden de talles guardado",
      title: "Guardar orden de talles",
    });
  }

  return (
    <section className="catalog-size-group ui-panel">
      <div className="catalog-size-group__header ui-section-header">
        <h3 className="text-h3">
          {group === "letter" ? "Talles letra" : "Talles numéricos"}
        </h3>
        <span className="text-caption">{sizes.length} opciones</span>
      </div>

      <CatalogSizeCreateForm group={group} onRequestMutation={requestMutation} />

      {orderedSizes.length > 0 ? (
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
            <div className="catalog-size-group__list">
              {orderedSizes.map((option, index) => (
                <CatalogSizeCard
                  group={group}
                  index={index}
                  key={option.id}
                  onRequestMutation={requestMutation}
                  option={option}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
      description: `Se agregara un nuevo talle al grupo ${group === "letter" ? "de letras" : "numerico"}.`,
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
    <form className="catalog-size-create" onSubmit={handleSubmit}>
      <input name="sizeGroup" type="hidden" value={group} />
      <label className="form-field">
        <span>Nuevo talle</span>
        <input
          inputMode={group === "numeric" ? "numeric" : "text"}
          name="name"
          placeholder={group === "letter" ? "Ej: XL" : "Ej: 42"}
        />
      </label>
      <button className="button button--primary" type="submit">
        Agregar
      </button>
    </form>
  );
}

function CatalogSizeCard({
  group,
  index,
  option,
  onRequestMutation,
}: {
  group: CatalogSizeGroup;
  index: number;
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
      description: option.is_active
        ? "El talle dejara de estar disponible para productos y filtros."
        : "El talle volvera a estar disponible para productos y filtros.",
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
      description: "Se eliminará el talle si no está siendo usado por productos.",
      execute: () => deleteCatalogOption("size", formData),
      successTitle: "Talle eliminado",
      title: "Eliminar talle",
      variant: "danger",
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onRequestMutation({
      confirmLabel: "Guardar talle",
      description: "Se actualizarán los datos del talle.",
      execute: () => updateCatalogOption("size", formData),
      successTitle: "Talle guardado",
      title: "Guardar talle",
    });
  }

  return (
    <article
      className={`catalog-size-card${
        isDragging ? " catalog-size-card--dragging" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="catalog-size-card__top">
        <div>
          <p className="catalog-config-pair">
            <span>Talle:</span>
            <strong>{option.label}</strong>
          </p>
          <p className="catalog-config-pair catalog-config-pair--muted">
            <span>Grupo:</span>
            <strong>{group === "letter" ? "Letras" : "Numéricos"}</strong>
          </p>
        </div>
        <div className="catalog-size-card__top-actions">
          <button
            className="catalog-config-action"
            onClick={() => setIsEditing((currentValue) => !currentValue)}
            type="button"
          >
            <Pencil aria-hidden="true" size={14} />
            {isEditing ? "Cerrar" : "Editar"}
          </button>
          <button
            aria-label={`Mover talle ${option.label}`}
            className="catalog-config-action catalog-config-action--drag catalog-size-card__drag"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden="true" size={15} />
            Mover
          </button>
          <button className="catalog-config-action" onClick={handleStatusChange} type="button">
            <Power aria-hidden="true" size={14} />
            {option.is_active ? "Desactivar" : "Activar"}
          </button>
          <button
            className="catalog-config-action catalog-config-action--danger"
            onClick={handleDelete}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Eliminar
          </button>
          <span
            className={`catalog-option-order${
              option.is_active ? "" : " catalog-option-order--inactive"
            }`}
          >
            {option.is_active ? "Activo" : "Inactivo"} · Orden {index + 1}
          </span>
        </div>
      </div>

      {isEditing ? (
        <form className="catalog-size-card__form" onSubmit={handleUpdate}>
          <input name="id" type="hidden" value={option.id} />
          <label className="form-field">
            <span className="text-label">Talle</span>
            <input defaultValue={option.label} name="name" />
          </label>
          <label className="form-field">
            <span className="text-label">Grupo</span>
            <select defaultValue={group} name="sizeGroup">
              <option value="letter">Letras</option>
              <option value="numeric">Numéricos</option>
            </select>
          </label>
          <button className="button button--primary" type="submit">
            Guardar
          </button>
        </form>
      ) : null}

    </article>
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
    <form className="catalog-option-create" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Nueva opción</span>
        <input name="name" placeholder={getCatalogOptionPlaceholder(kind)} />
      </label>

      <button className="button button--primary" type="submit">
        Agregar
      </button>
    </form>
  );
}

function CatalogOptionRow({
  kind,
  onDelete,
  onRequestMutation,
  onToggleStatus,
  position,
  option,
}: {
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

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRequestMutation(new FormData(event.currentTarget));
  }

  return (
    <article
      className={`catalog-option-row${
        isDragging ? " catalog-option-row--dragging" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="catalog-option-row__summary">
        <div>
          <p className="catalog-config-pair">
            <span>{getCatalogOptionKindLabel(kind)}:</span>
            <strong>{label}</strong>
          </p>
        </div>
        <div className="catalog-option-row__status">
          <button
            className="catalog-config-action"
            onClick={() => setIsEditing((currentValue) => !currentValue)}
            type="button"
          >
            <Pencil aria-hidden="true" size={14} />
            {isEditing ? "Cerrar" : "Editar"}
          </button>
          <button
            aria-label={`Mover ${label}`}
            className="catalog-config-action catalog-config-action--drag catalog-option-row__drag"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden="true" size={15} />
            Mover
          </button>
          <button
            className="catalog-config-action"
            onClick={() => onToggleStatus(option)}
            type="button"
          >
            <Power aria-hidden="true" size={14} />
            {option.is_active ? "Desactivar" : "Activar"}
          </button>
          <button
            className="catalog-config-action catalog-config-action--danger"
            onClick={() => onDelete(option)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Eliminar
          </button>
          <span
            className={`catalog-option-order${
              option.is_active ? "" : " catalog-option-order--inactive"
            }`}
          >
            {option.is_active ? "Activo" : "Inactivo"} · Orden {position}
          </span>
        </div>
      </div>

      {isEditing ? (
        <form className="catalog-option-row__form" onSubmit={handleUpdate}>
          <input name="id" type="hidden" value={option.id} />
          <label className="form-field">
            <span>{label}</span>
            <input defaultValue={label} name="name" />
          </label>

          <div className="catalog-option-row__actions">
            <button className="button" type="submit">
              Guardar
            </button>
            <button
              className="button"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

    </article>
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
