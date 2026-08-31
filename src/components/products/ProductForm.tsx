import { ImageUploader } from "@/components/products/ImageUploader";
import type { CatalogOptions } from "@/features/catalog-options/types";
import type { SelectedImage } from "@/features/images/types";
import { formatMeasurementInput } from "@/features/measurements/formatters";
import type { ProductFormState } from "@/features/products/actions";
import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
} from "@/features/products/constants";
import type {
  ChangeEvent,
  DragEvent,
  FocusEvent,
  FormEvent,
  RefObject,
} from "react";
import type {
  ProductFieldErrors,
  ProductFieldName,
} from "@/features/products/form-validation";

type ProductFormProps = {
  descriptionLength: number;
  fieldErrors: ProductFieldErrors;
  fileInputRef: RefObject<HTMLInputElement | null>;
  formRef: RefObject<HTMLFormElement | null>;
  imageFeedbackMessage: string;
  imageFeedbackVariant: "error" | "info";
  images: SelectedImage[];
  initialValues?: {
    brandId?: string | null;
    categoryId?: string | null;
    conditionId?: string | null;
    description?: string;
    heightCm?: number | null;
    inventoryItemId?: string;
    price?: number | null;
    sizeId?: string | null;
    title?: string;
    widthCm?: number | null;
  };
  isDragging: boolean;
  isPending: boolean;
  isMeasurementTemplateEnabled: boolean;
  isPriceCalculatorEnabled: boolean;
  isPriceCalculationPending: boolean;
  options: CatalogOptions;
  priceValue: string;
  purchasePriceValue: string;
  selectedCategoryId: string;
  state: ProductFormState;
  suggestedPriceLabel: string;
  totalImageCount: number;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onDragChange: (isDragging: boolean) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFieldBlur: (
    event: FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onFieldChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMeasurementChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMeasurementTemplateEnabledChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPriceCalculatorEnabledChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPurchasePriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (imageId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProductForm({
  descriptionLength,
  fieldErrors,
  fileInputRef,
  formRef,
  imageFeedbackMessage,
  imageFeedbackVariant,
  images,
  initialValues,
  isDragging,
  isPending,
  isMeasurementTemplateEnabled,
  isPriceCalculatorEnabled,
  isPriceCalculationPending,
  options,
  priceValue,
  purchasePriceValue,
  selectedCategoryId,
  state,
  suggestedPriceLabel,
  totalImageCount,
  onCategoryChange,
  onDragChange,
  onDrop,
  onFieldBlur,
  onFieldChange,
  onFileChange,
  onMeasurementChange,
  onMeasurementTemplateEnabledChange,
  onPriceChange,
  onPriceCalculatorEnabledChange,
  onPurchasePriceChange,
  onRemoveImage,
  onSubmit,
}: ProductFormProps) {
  const availableSizes = getAvailableSizes(options, selectedCategoryId);
  const imageErrorMessage =
    imageFeedbackVariant === "error" ? imageFeedbackMessage : "";
  const uploaderFeedbackMessage = imageErrorMessage ? "" : imageFeedbackMessage;

  return (
    <form className="product-form" noValidate onSubmit={onSubmit} ref={formRef}>
      {initialValues?.inventoryItemId ? (
        <input
          name="inventory_item_id"
          type="hidden"
          value={initialValues.inventoryItemId}
        />
      ) : null}
      <section className="inventory-form__section">
        <div className="inventory-form__section-head">
          <h3>Identificación</h3>
          <p>Datos principales para reconocer la prenda en el catálogo.</p>
        </div>

        <div className="inventory-form__row inventory-form__row--two">
          <label
            className={getFieldClassName(fieldErrors.title)}
            htmlFor="title"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="title"
              label="Título *"
            />
            <input
              aria-describedby={getErrorId("title", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.title)}
              defaultValue={initialValues?.title ?? ""}
              id="title"
              name="title"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
              type="text"
            />
          </label>

          <label
            className={getFieldClassName(fieldErrors.brand)}
            htmlFor="brand"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="brand"
              label="Marca *"
            />
            <select
              aria-describedby={getErrorId("brand", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.brand)}
              defaultValue={initialValues?.brandId ?? ""}
              disabled={options.brands.length === 0}
              id="brand"
              name="brand"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
            >
              <option value="">Seleccionar</option>
              {options.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="inventory-form__row inventory-form__row--three">
          <label
            className={getFieldClassName(fieldErrors.category)}
            htmlFor="category"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="category"
              label="Categoría *"
            />
            <select
              aria-describedby={getErrorId("category", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.category)}
              defaultValue={initialValues?.categoryId ?? ""}
              disabled={options.categories.length === 0}
              id="category"
              name="category"
              onBlur={onFieldBlur}
              onChange={onCategoryChange}
              required
            >
              <option value="">Seleccionar</option>
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className={getFieldClassName(fieldErrors.size)} htmlFor="size">
            <FieldLabel errors={fieldErrors} fieldName="size" label="Talle *" />
            <select
              aria-describedby={getErrorId("size", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.size)}
              disabled={!selectedCategoryId || availableSizes.length === 0}
              defaultValue={initialValues?.sizeId ?? ""}
              id="size"
              key={selectedCategoryId}
              name="size"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
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
            className={getFieldClassName(fieldErrors.condition)}
            htmlFor="condition"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="condition"
              label="Estado *"
            />
            <select
              aria-describedby={getErrorId("condition", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.condition)}
              defaultValue={initialValues?.conditionId ?? ""}
              disabled={options.conditions.length === 0}
              id="condition"
              name="condition"
              onBlur={onFieldBlur}
              onChange={onFieldChange}
              required
            >
              <option value="">Seleccionar</option>
              {options.conditions.map((condition) => (
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
          <p>Información comercial visible para publicar correctamente.</p>
        </div>

        <div className="inventory-form__row inventory-form__row--three">
          <label
            className={getFieldClassName(fieldErrors.price)}
            htmlFor="price"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="price"
              label="Precio en pesos *"
            />
            <input
              aria-describedby={getErrorId("price", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.price)}
              id="price"
              inputMode="numeric"
              name="price"
              onBlur={onFieldBlur}
              onChange={onPriceChange}
              placeholder="$0"
              required
              type="text"
              value={priceValue}
            />
          </label>

          <label
            className={getFieldClassName(fieldErrors.height_cm)}
            htmlFor="height_cm"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="height_cm"
              label="Alto en cm *"
            />
            <input
              aria-describedby={getErrorId("height_cm", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.height_cm)}
              defaultValue={formatMeasurementInput(initialValues?.heightCm)}
              id="height_cm"
              inputMode="decimal"
              name="height_cm"
              onBlur={onFieldBlur}
              onChange={onMeasurementChange}
              placeholder="Ej: 68,5"
              required
              type="text"
            />
          </label>

          <label
            className={getFieldClassName(fieldErrors.width_cm)}
            htmlFor="width_cm"
          >
            <FieldLabel
              errors={fieldErrors}
              fieldName="width_cm"
              label="Ancho en cm *"
            />
            <input
              aria-describedby={getErrorId("width_cm", fieldErrors)}
              aria-invalid={Boolean(fieldErrors.width_cm)}
              defaultValue={formatMeasurementInput(initialValues?.widthCm)}
              id="width_cm"
              inputMode="decimal"
              name="width_cm"
              onBlur={onFieldBlur}
              onChange={onMeasurementChange}
              placeholder="Ej: 54"
              required
              type="text"
            />
          </label>
        </div>

        <div className="product-form__options-row">
          <div className="product-form__option">
            <label className="product-form__option-toggle">
              <input
                checked={isPriceCalculatorEnabled}
                onChange={onPriceCalculatorEnabledChange}
                type="checkbox"
              />
              <span>
                <strong>Calcular desde precio de compra</strong>
                <small>
                  Usa los parámetros actuales de la calculadora para sugerir el
                  precio de venta.
                </small>
              </span>
            </label>

            {isPriceCalculatorEnabled ? (
              <label
                className="form-field product-form__purchase-field"
                htmlFor="purchase_price_helper"
              >
                <span className="form-field__label-row">
                  <span>Precio de compra</span>
                  {isPriceCalculationPending ? (
                    <small>Calculando...</small>
                  ) : null}
                </span>
                <input
                  id="purchase_price_helper"
                  inputMode="numeric"
                  onChange={onPurchasePriceChange}
                  placeholder="$0"
                  type="text"
                  value={purchasePriceValue}
                />
                <p className="form-field__hint" aria-live="polite">
                  {suggestedPriceLabel ||
                    "El precio sugerido se aplicará arriba y después podés editarlo."}
                </p>
              </label>
            ) : null}
          </div>

          <label className="product-form__option product-form__option-toggle">
            <input name="is_exclusive" type="checkbox" />
            <span>
              <strong>Producto exclusivo</strong>
              <small>Marcalo para destacarlo como selección premium.</small>
            </span>
          </label>

          <label className="product-form__option product-form__option-toggle">
            <input
              checked={isMeasurementTemplateEnabled}
              onChange={onMeasurementTemplateEnabledChange}
              type="checkbox"
            />
            <span>
              <strong>Agregar plantilla de medidas</strong>
              <small>
                Se genera con alto y ancho, y se sube como última imagen.
              </small>
            </span>
          </label>
        </div>
      </section>

      <section className="inventory-form__section">
        <div className="inventory-form__section-head">
          <h3>Descripción</h3>
          <p>Contenido comercial que verá el cliente en la publicación.</p>
        </div>

        <label
          className={getFieldClassName(fieldErrors.description)}
          htmlFor="description"
        >
          <FieldLabel
            errors={fieldErrors}
            fieldName="description"
            label="Descripción / estado *"
          />
          <textarea
            aria-describedby={getDescriptionAriaDescribedBy(fieldErrors)}
            aria-invalid={Boolean(fieldErrors.description)}
            defaultValue={initialValues?.description ?? ""}
            id="description"
            maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
            name="description"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            required
            rows={5}
          />
          <p className="form-field__hint">
            {descriptionLength}/{PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.
          </p>
        </label>
      </section>

      <section className="inventory-form__section">
        <ImageUploader
          disabled={isPending}
          fileInputRef={fileInputRef}
          feedbackMessage={uploaderFeedbackMessage}
          feedbackVariant={imageFeedbackVariant}
          images={images}
          countLabel={`${totalImageCount}/${MAX_PRODUCT_IMAGES}`}
          isAddDisabled={totalImageCount >= MAX_PRODUCT_IMAGES}
          isDragging={isDragging}
          onDragChange={onDragChange}
          onDrop={onDrop}
          onFileChange={onFileChange}
          onRemoveImage={onRemoveImage}
        />
      </section>

      {imageErrorMessage ? (
        <p aria-live="polite" className="auth-form__error">
          {imageErrorMessage}
        </p>
      ) : null}

      {state.message && !state.success ? (
        <p aria-live="polite" className="auth-form__error">
          {state.message}
        </p>
      ) : null}

      <div className="product-form__actions">
        <button
          className="button button--primary"
          disabled={isPending}
          type="submit"
        >
          Cargar producto
        </button>
      </div>
    </form>
  );
}

function FieldLabel({
  errors,
  fieldName,
  label,
}: {
  errors: ProductFieldErrors;
  fieldName: ProductFieldName;
  label: string;
}) {
  const message = errors[fieldName];

  return (
    <span className="form-field__label-row">
      <span>{label}</span>
      {message ? (
        <small
          className="form-field__error"
          id={`${fieldName}-error`}
          role="alert"
        >
          {message}
        </small>
      ) : null}
    </span>
  );
}

function getErrorId(
  fieldName: ProductFieldName,
  errors: ProductFieldErrors,
) {
  return errors[fieldName] ? `${fieldName}-error` : undefined;
}

function getFieldClassName(error?: string) {
  return `form-field${error ? " form-field--error" : ""}`;
}

function getDescriptionAriaDescribedBy(errors: ProductFieldErrors) {
  return errors.description ? "description-error" : undefined;
}

function getAvailableSizes(options: CatalogOptions, selectedCategoryId: string) {
  if (!selectedCategoryId) {
    return options.sizes;
  }

  const selectedCategory = options.categories.find(
    (category) => category.id === selectedCategoryId,
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
