import type { CatalogOptions } from "@/features/catalog-options/types";
import { formatMeasurementInput } from "@/features/measurements/formatters";
import { PRODUCT_DESCRIPTION_MAX_LENGTH } from "@/features/products/constants";
import type { ProductFormState } from "@/features/products/actions";
import {
  formatProductPriceInput,
  type ProductFieldErrors,
  type ProductFieldName,
} from "@/features/products/form-validation";
import type { Product } from "@/features/products/types";
import type { ChangeEvent, FocusEvent, FormEvent, RefObject } from "react";

type EditProductFormProps = {
  descriptionLength: number;
  fieldErrors: ProductFieldErrors;
  formRef: RefObject<HTMLFormElement | null>;
  initialBrandId: string;
  initialCategoryId: string;
  initialConditionId: string;
  initialSizeId: string;
  isPending: boolean;
  options: CatalogOptions;
  product: Product;
  selectedCategoryId: string;
  state: ProductFormState;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
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
  onMeasurementChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EditProductForm({
  descriptionLength,
  fieldErrors,
  formRef,
  initialBrandId,
  initialCategoryId,
  initialConditionId,
  initialSizeId,
  isPending,
  options,
  product,
  selectedCategoryId,
  state,
  onCategoryChange,
  onFieldBlur,
  onFieldChange,
  onMeasurementChange,
  onPriceChange,
  onSubmit,
}: EditProductFormProps) {
  const availableSizes = getAvailableSizes(options, selectedCategoryId);

  return (
    <form className="product-form" noValidate onSubmit={onSubmit} ref={formRef}>
      <div className="product-form__grid">
        <label className={getFieldClassName(fieldErrors.title)} htmlFor="title">
          <FieldLabel errors={fieldErrors} fieldName="title" label="Titulo *" />
          <input
            aria-describedby={getErrorId("title", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.title)}
            defaultValue={product.title}
            id="title"
            name="title"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            required
            type="text"
          />
        </label>

        <label className={getFieldClassName(fieldErrors.brand)} htmlFor="brand">
          <FieldLabel errors={fieldErrors} fieldName="brand" label="Marca *" />
          <select
            aria-describedby={getErrorId("brand", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.brand)}
            defaultValue={initialBrandId}
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

        <label
          className={getFieldClassName(fieldErrors.category)}
          htmlFor="category"
        >
          <FieldLabel
            errors={fieldErrors}
            fieldName="category"
            label="Categoria *"
          />
          <select
            aria-describedby={getErrorId("category", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.category)}
            defaultValue={initialCategoryId}
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
            defaultValue={initialSizeId}
            disabled={!selectedCategoryId || availableSizes.length === 0}
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
                : "Selecciona una categoria primero"}
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
            errors={fieldErrors}
            fieldName="height_cm"
            label="Alto en cm *"
          />
          <input
            aria-describedby={getErrorId("height_cm", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.height_cm)}
            defaultValue={formatMeasurementInput(product.height_cm)}
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
            defaultValue={formatMeasurementInput(product.width_cm)}
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
            defaultValue={initialConditionId}
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

        <label className={getFieldClassName(fieldErrors.price)} htmlFor="price">
          <FieldLabel
            errors={fieldErrors}
            fieldName="price"
            label="Precio en pesos *"
          />
          <input
            aria-describedby={getErrorId("price", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.price)}
            defaultValue={formatProductPriceInput(String(product.price))}
            id="price"
            inputMode="numeric"
            name="price"
            onBlur={onFieldBlur}
            onChange={onPriceChange}
            placeholder="$0"
            required
            type="text"
          />
        </label>
      </div>

      <label className="product-form__toggle">
        <input
          defaultChecked={product.is_exclusive}
          name="is_exclusive"
          type="checkbox"
        />
        <span>
          <strong>Producto exclusivo</strong>
          <small>Marcalo para destacarlo como seleccion premium.</small>
        </span>
      </label>

      <label
        className={getFieldClassName(fieldErrors.description)}
        htmlFor="description"
      >
        <FieldLabel
          errors={fieldErrors}
          fieldName="description"
          label="Descripcion / estado *"
        />
        <textarea
          aria-describedby={getDescriptionAriaDescribedBy(fieldErrors)}
          aria-invalid={Boolean(fieldErrors.description)}
          defaultValue={product.description ?? ""}
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
          Guardar cambios
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
