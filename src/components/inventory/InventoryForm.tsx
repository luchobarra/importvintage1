import { ImageUploader } from "@/components/products/ImageUploader";
import { DatePicker } from "@/components/ui/DatePicker";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProductCondition,
} from "@/features/catalog-options/types";
import {
  INVENTORY_NOTES_MAX_LENGTH,
  INVENTORY_TEXT_MAX_LENGTH,
  MAX_INVENTORY_IMAGES,
} from "@/features/inventory/constants";
import type { InventoryFieldErrors } from "@/features/inventory/validation";
import type { SelectedImage } from "@/features/images/types";
import { formatMeasurementInput } from "@/features/measurements/formatters";
import type { ChangeEvent, DragEvent, FormEvent, RefObject } from "react";

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
  stateMessage: string;
  values: InventoryFormValues;
  onDragChange: (isDragging: boolean) => void;
  onDateChange: (fieldName: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
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
  stateMessage,
  values,
  onDragChange,
  onDateChange,
  onDrop,
  onFieldChange,
  onFileChange,
  onMeasurementChange,
  onPriceChange,
  onRemoveImage,
  onSubmit,
}: InventoryFormProps) {
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

      <div className="inventory-form__row inventory-form__row--two inventory-form__row--align-end">
        <label className={getFieldClassName(fieldErrors.title)} htmlFor="title">
          <FieldLabel error={fieldErrors.title} label="Título *" />
          <input
            defaultValue={values.title ?? ""}
            id="title"
            name="title"
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
            label="Fecha de compra *"
          />
          <DatePicker
            defaultValue={values.purchase_date}
            id="purchase_date"
            name="purchase_date"
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
          <FieldLabel error={fieldErrors.category_id} label="Categoría *" />
          <select
            defaultValue={values.category_id ?? ""}
            disabled={categories.length === 0}
            id="category_id"
            name="category_id"
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

        <label className="form-field" htmlFor="brand_id">
          <span className="form-field__label-row">
            <span>Marca</span>
          </span>
          <select
            defaultValue={values.brand_id ?? ""}
            disabled={brands.length === 0}
            id="brand_id"
            name="brand_id"
            onChange={onFieldChange}
          >
            <option value="">Sin marca</option>
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
          <FieldLabel error={fieldErrors.condition_id} label="Estado *" />
          <select
            defaultValue={values.condition_id ?? ""}
            disabled={conditions.length === 0}
            id="condition_id"
            name="condition_id"
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

      <div className="inventory-form__row inventory-form__row--three inventory-form__row--align-end">
        <label
          className={getFieldClassName(fieldErrors.purchase_price)}
          htmlFor="purchase_price"
        >
          <FieldLabel
            error={fieldErrors.purchase_price}
            label="Precio de compra *"
          />
          <input
            id="purchase_price"
            inputMode="numeric"
            name="purchase_price"
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
            label="Precio estimado de venta"
          />
          <input
            id="estimated_sale_price"
            inputMode="numeric"
            name="estimated_sale_price"
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

      <div className="inventory-form__row inventory-form__row--two">
        <label
          className={getFieldClassName(fieldErrors.height_cm)}
          htmlFor="height_cm"
        >
          <FieldLabel error={fieldErrors.height_cm} label="Alto en cm" />
          <input
            defaultValue={formatMeasurementInput(values.height_cm)}
            id="height_cm"
            inputMode="decimal"
            name="height_cm"
            onChange={onMeasurementChange}
            placeholder="Ej: 68,5"
            type="text"
          />
        </label>

        <label
          className={getFieldClassName(fieldErrors.width_cm)}
          htmlFor="width_cm"
        >
          <FieldLabel error={fieldErrors.width_cm} label="Ancho en cm" />
          <input
            defaultValue={formatMeasurementInput(values.width_cm)}
            id="width_cm"
            inputMode="decimal"
            name="width_cm"
            onChange={onMeasurementChange}
            placeholder="Ej: 54"
            type="text"
          />
        </label>
      </div>

      <label
        className={getFieldClassName(fieldErrors.internal_description)}
        htmlFor="internal_description"
      >
        <FieldLabel
          error={fieldErrors.internal_description}
          label="Descripción *"
        />
        <textarea
          defaultValue={values.internal_description ?? ""}
          id="internal_description"
          maxLength={INVENTORY_TEXT_MAX_LENGTH}
          name="internal_description"
          onChange={onFieldChange}
          required
          rows={4}
        />
      </label>

      <label
        className={getFieldClassName(fieldErrors.internal_notes)}
        htmlFor="internal_notes"
      >
        <FieldLabel error={fieldErrors.internal_notes} label="Notas" />
        <textarea
          defaultValue={values.internal_notes ?? ""}
          id="internal_notes"
          maxLength={INVENTORY_NOTES_MAX_LENGTH}
          name="internal_notes"
          onChange={onFieldChange}
          rows={3}
        />
      </label>

      {allowImageUpload ? (
        <ImageUploader
          actionLabel="Buscar fotos"
          ariaLabel="Fotos del producto"
          countLabel={`${images.length}/${MAX_INVENTORY_IMAGES}`}
          description={`Mínimo 1, máximo ${MAX_INVENTORY_IMAGES}. Se optimizan antes de subir.`}
          disabled={isPending}
          dropzoneText="Arrastra 1 o 2 fotos simples para identificar el producto."
          feedbackMessage={imageFeedbackMessage}
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
      ) : null}

      {stateMessage ? (
        <p aria-live="polite" className="auth-form__error">
          {stateMessage}
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

function FieldLabel({ error, label }: { error?: string; label: string }) {
  return (
    <span className="form-field__label-row">
      <span>{label}</span>
      {error ? (
        <small className="form-field__error" role="alert">
          {error}
        </small>
      ) : null}
    </span>
  );
}

function getFieldClassName(error?: string) {
  return `form-field${error ? " form-field--error" : ""}`;
}
