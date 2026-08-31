import { ImageUploader } from "@/components/products/ImageUploader";
import { DatePicker } from "@/components/ui/DatePicker";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProductCondition,
  CatalogSize,
} from "@/features/catalog-options/types";
import {
  INVENTORY_NOTES_MAX_LENGTH,
  INVENTORY_TEXT_MAX_LENGTH,
  MAX_INVENTORY_IMAGES,
} from "@/features/inventory/constants";
import type { InventoryFieldErrors } from "@/features/inventory/validation";
import type { SelectedImage } from "@/features/images/types";
import { formatMeasurementInput } from "@/features/measurements/formatters";
import type {
  ChangeEvent,
  DragEvent,
  FocusEvent,
  FormEvent,
  RefObject,
} from "react";

type InventoryFormValues = {
  brand_id?: string | null;
  category_id?: string | null;
  condition_notes?: string | null;
  condition_id?: string | null;
  estimated_sale_price?: number | null;
  estimated_sale_price_input?: string;
  height_cm?: number | null;
  internal_description?: string | null;
  internal_notes?: string | null;
  purchase_date: string;
  purchase_price?: number | null;
  purchase_price_input?: string;
  size_id?: string | null;
  title?: string | null;
  visible_id?: string | null;
  width_cm?: number | null;
};

type InventoryFormProps = {
  allowImageUpload: boolean;
  brands: CatalogBrand[];
  categories: CatalogCategory[];
  conditions: CatalogProductCondition[];
  calculationSummary: {
    estimatedProfit: string;
    margin: string;
  } | null;
  fieldErrors: InventoryFieldErrors;
  fileInputRef: RefObject<HTMLInputElement | null>;
  formRef: RefObject<HTMLFormElement | null>;
  imageFeedbackMessage: string;
  imageFeedbackVariant: "error" | "info";
  images: SelectedImage[];
  isDragging: boolean;
  isPriceCalculationPending: boolean;
  isPending: boolean;
  selectedCategoryId: string;
  sizes: CatalogSize[];
  stateMessage: string;
  values: InventoryFormValues;
  onDragChange: (isDragging: boolean) => void;
  onDateBlur: (fieldName: string, value: string) => void;
  onDateChange: (fieldName: string, value: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFieldBlur: (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onFieldChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMeasurementChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (imageId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function InventoryForm({
  allowImageUpload,
  brands,
  categories,
  conditions,
  calculationSummary,
  fieldErrors,
  fileInputRef,
  formRef,
  imageFeedbackMessage,
  imageFeedbackVariant,
  images,
  isDragging,
  isPriceCalculationPending,
  isPending,
  selectedCategoryId,
  sizes,
  stateMessage,
  values,
  onDragChange,
  onDateBlur,
  onDateChange,
  onDrop,
  onFieldBlur,
  onFieldChange,
  onFileChange,
  onMeasurementChange,
  onPriceChange,
  onRemoveImage,
  onSubmit,
}: InventoryFormProps) {
  const availableSizes = getAvailableSizes(sizes, categories, selectedCategoryId);
  const imageErrorMessage =
    imageFeedbackVariant === "error" ? imageFeedbackMessage : "";
  const uploaderFeedbackMessage = imageErrorMessage ? "" : imageFeedbackMessage;
  const formMessage =
    stateMessage && stateMessage !== imageErrorMessage ? stateMessage : "";

  return (
    <form className="inventory-form" noValidate onSubmit={onSubmit} ref={formRef}>
      {values.visible_id ? (
        <label className="form-field" htmlFor="visible_id">
          <span className="form-field__label-row">
            <span>ID</span>
          </span>
          <input
            disabled
            id="visible_id"
            name="visible_id"
            type="text"
            value={values.visible_id}
          />
        </label>
      ) : null}

      <section className="inventory-form__section">
        <div className="inventory-form__section-head">
          <h3>Identificación</h3>
          <p>Datos mínimos para encontrar y reconocer la prenda.</p>
        </div>
        <div className="inventory-form__row inventory-form__row--two inventory-form__row--align-end">
          <label className={getFieldClassName(fieldErrors.title)} htmlFor="title">
            <FieldLabel
              error={fieldErrors.title}
              fieldName="title"
              label="Título *"
            />
            <input
              aria-describedby={getErrorId("title", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.title)}
              defaultValue={values.title ?? ""}
              id="title"
              name="title"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
              type="text"
            />
          </label>

          <label
            className={getFieldClassName(fieldErrors.purchase_date)}
            htmlFor="purchase_date"
          >
            <FieldLabel
              error={fieldErrors.purchase_date}
              fieldName="purchase_date"
              label="Fecha de compra *"
            />
            <DatePicker
              ariaDescribedBy={getErrorId("purchase_date", fieldErrors)}
              defaultValue={values.purchase_date}
              id="purchase_date"
              name="purchase_date"
              onBlur={onDateBlur}
              onChange={onDateChange}
              required
            />
          </label>
        </div>

        <div className="inventory-form__row inventory-form__row--three">
          <label
            className={getFieldClassName(fieldErrors.category_id)}
            htmlFor="category_id"
          >
            <FieldLabel
              error={fieldErrors.category_id}
              fieldName="category_id"
              label="Categoría *"
            />
            <select
              aria-describedby={getErrorId("category_id", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.category_id)}
              defaultValue={values.category_id ?? ""}
              disabled={categories.length === 0}
              id="category_id"
              name="category_id"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
            >
              <option value="">Seleccionar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label
            className={getFieldClassName(fieldErrors.brand_id)}
            htmlFor="brand_id"
          >
            <FieldLabel
              error={fieldErrors.brand_id}
              fieldName="brand_id"
              label="Marca *"
            />
            <select
              aria-describedby={getErrorId("brand_id", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.brand_id)}
              defaultValue={values.brand_id ?? ""}
              disabled={brands.length === 0}
              id="brand_id"
              name="brand_id"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
            >
              <option value="">Seleccionar</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <label
            className={getFieldClassName(fieldErrors.condition_id)}
            htmlFor="condition_id"
          >
            <FieldLabel
              error={fieldErrors.condition_id}
              fieldName="condition_id"
              label="Estado *"
            />
            <select
              aria-describedby={getErrorId("condition_id", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.condition_id)}
              defaultValue={values.condition_id ?? ""}
              disabled={conditions.length === 0}
              id="condition_id"
              name="condition_id"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
            >
              <option value="">Seleccionar</option>
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="inventory-form__section">
        <div className="inventory-form__section-head">
          <h3>Precio y medidas</h3>
          <p>Base comercial para venta, publicación y seguimiento.</p>
        </div>
        <div className="inventory-form__row inventory-form__row--three inventory-form__row--align-end">
          <label
            className={getFieldClassName(fieldErrors.purchase_price)}
            htmlFor="purchase_price"
          >
            <FieldLabel
              error={fieldErrors.purchase_price}
              fieldName="purchase_price"
              label="Precio de compra *"
            />
            <input
              aria-describedby={getErrorId("purchase_price", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.purchase_price)}
              id="purchase_price"
              inputMode="numeric"
              name="purchase_price"
              onBlur={onFieldBlur}
              onChange={onPriceChange}
              placeholder="$0"
              required
              type="text"
              value={values.purchase_price_input ?? ""}
            />
          </label>

          <label
            className={getFieldClassName(fieldErrors.estimated_sale_price)}
            htmlFor="estimated_sale_price"
          >
            <FieldLabel
              error={fieldErrors.estimated_sale_price}
              fieldName="estimated_sale_price"
              label="Precio estimado de venta"
            />
            <input
              aria-describedby={getErrorId("estimated_sale_price", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.estimated_sale_price)}
              id="estimated_sale_price"
              inputMode="numeric"
              name="estimated_sale_price"
              onBlur={onFieldBlur}
              onChange={onPriceChange}
              placeholder="$0"
              type="text"
              value={values.estimated_sale_price_input ?? ""}
            />
          </label>

          <div className="inventory-calculation-field">
            <span className="form-field__label-row">
              <span>Resumen de precio</span>
              {isPriceCalculationPending ? <small>Calculando...</small> : null}
            </span>
            <div className="inventory-calculation-card" aria-live="polite">
              <dl>
                <div>
                  <dt>Ganancia est.</dt>
                  <dd>
                    {isPriceCalculationPending
                      ? "..."
                      : calculationSummary?.estimatedProfit ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt>Margen</dt>
                  <dd>
                    {isPriceCalculationPending
                      ? "..."
                      : calculationSummary?.margin ?? "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="inventory-form__row inventory-form__row--three">
          <label
            className={getFieldClassName(fieldErrors.size_id)}
            htmlFor="size_id"
          >
            <FieldLabel
              error={fieldErrors.size_id}
              fieldName="size_id"
              label="Talle"
            />
            <select
              aria-describedby={getErrorId("size_id", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.size_id)}
              defaultValue={values.size_id ?? ""}
              disabled={!selectedCategoryId || availableSizes.length === 0}
              id="size_id"
              key={selectedCategoryId}
              name="size_id"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
            >
              <option value="">
                {selectedCategoryId
                  ? "Seleccionar"
                  : "Selecciona una categoría primero"}
              </option>
              {availableSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.label}
                </option>
              ))}
            </select>
          </label>

          <label
            className={getFieldClassName(fieldErrors.height_cm)}
            htmlFor="height_cm"
          >
            <FieldLabel
              error={fieldErrors.height_cm}
              fieldName="height_cm"
              label="Alto en cm"
            />
            <input
              aria-describedby={getErrorId("height_cm", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.height_cm)}
              defaultValue={formatMeasurementInput(values.height_cm)}
              id="height_cm"
              inputMode="decimal"
              name="height_cm"
              onBlur={onFieldBlur}
              onChange={onMeasurementChange}
              placeholder="Ej: 68,5"
              type="text"
            />
          </label>

          <label
            className={getFieldClassName(fieldErrors.width_cm)}
            htmlFor="width_cm"
          >
            <FieldLabel
              error={fieldErrors.width_cm}
              fieldName="width_cm"
              label="Ancho en cm"
            />
            <input
              aria-describedby={getErrorId("width_cm", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.width_cm)}
              defaultValue={formatMeasurementInput(values.width_cm)}
              id="width_cm"
              inputMode="decimal"
              name="width_cm"
              onBlur={onFieldBlur}
              onChange={onMeasurementChange}
              placeholder="Ej: 54"
              type="text"
            />
          </label>
        </div>
      </section>

      <section className="inventory-form__section">
        <div className="inventory-form__section-head">
          <h3>Descripción interna</h3>
          <p>Información útil para revisar, publicar o vender la prenda.</p>
        </div>
        <label
          className={getFieldClassName(fieldErrors.internal_description)}
          htmlFor="internal_description"
        >
          <FieldLabel
            error={fieldErrors.internal_description}
            fieldName="internal_description"
            label="Descripción *"
          />
          <textarea
            aria-describedby={getErrorId("internal_description", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.internal_description)}
            defaultValue={values.internal_description ?? ""}
            id="internal_description"
            maxLength={INVENTORY_TEXT_MAX_LENGTH}
            name="internal_description"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            required
            rows={4}
          />
        </label>

        <label
          className={getFieldClassName(fieldErrors.internal_notes)}
          htmlFor="internal_notes"
        >
          <FieldLabel
            error={fieldErrors.internal_notes}
            fieldName="internal_notes"
            label="Notas"
          />
          <textarea
            aria-describedby={getErrorId("internal_notes", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.internal_notes)}
            defaultValue={values.internal_notes ?? ""}
            id="internal_notes"
            maxLength={INVENTORY_NOTES_MAX_LENGTH}
            name="internal_notes"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            rows={3}
          />
        </label>
      </section>

      {allowImageUpload ? (
        <section className="inventory-form__section">
          <ImageUploader
            actionLabel="Buscar fotos"
            ariaLabel="Fotos del producto"
            countLabel={`${images.length}/${MAX_INVENTORY_IMAGES}`}
            description={`Mínimo 1, máximo ${MAX_INVENTORY_IMAGES}. Se optimizan antes de subir.`}
            disabled={isPending}
            dropzoneText="Arrastra 1 o 2 fotos simples para identificar el producto."
            feedbackMessage={uploaderFeedbackMessage}
            feedbackVariant={imageFeedbackVariant}
            fileInputRef={fileInputRef}
            images={images}
            isAddDisabled={images.length >= MAX_INVENTORY_IMAGES}
            isDragging={isDragging}
            onDragChange={onDragChange}
            onDrop={onDrop}
            onFileChange={onFileChange}
            onRemoveImage={onRemoveImage}
            title="Fotos *"
          />
        </section>
      ) : null}

      {imageErrorMessage ? (
        <p aria-live="polite" className="auth-form__error">
          {imageErrorMessage}
        </p>
      ) : null}

      {formMessage ? (
        <p aria-live="polite" className="auth-form__error">
          {formMessage}
        </p>
      ) : null}

      <div className="product-form__actions">
        <button
          className="button button--primary"
          disabled={isPending}
          type="submit"
        >
          Guardar ingreso
        </button>
      </div>
    </form>
  );
}

function FieldLabel({
  error,
  fieldName,
  label,
}: {
  error?: string;
  fieldName?: string;
  label: string;
}) {
  return (
    <span className="form-field__label-row">
      <span>{label}</span>
      {error ? (
        <small
          className="form-field__error"
          id={fieldName ? `${fieldName}-error` : undefined}
          role="alert"
        >
          {error}
        </small>
      ) : null}
    </span>
  );
}

function getFieldClassName(error?: string) {
  return `form-field${error ? " form-field--error" : ""}`;
}

function getErrorId(
  fieldName: string,
  errors: InventoryFieldErrors,
) {
  return errors[fieldName as keyof InventoryFieldErrors]
    ? `${fieldName}-error`
    : undefined;
}

function getAvailableSizes(
  sizes: CatalogSize[],
  categories: CatalogCategory[],
  selectedCategoryId: string,
) {
  if (!selectedCategoryId) {
    return sizes;
  }

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  if (!selectedCategory) {
    return sizes;
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

  return sizes.filter((size) => allowedGroups.has(size.size_group));
}
