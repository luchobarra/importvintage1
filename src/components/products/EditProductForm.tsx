import {
  PRODUCT_CATEGORIES,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
} from "@/features/products/constants";
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
  isPending: boolean;
  product: Product;
  state: ProductFormState;
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
  onPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSizeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EditProductForm({
  descriptionLength,
  fieldErrors,
  formRef,
  isPending,
  product,
  state,
  onFieldBlur,
  onFieldChange,
  onPriceChange,
  onSizeChange,
  onSubmit,
}: EditProductFormProps) {
  return (
    <form className="product-form" noValidate onSubmit={onSubmit} ref={formRef}>
      <div className="product-form__grid">
        <label className={getFieldClassName(fieldErrors.title)} htmlFor="title">
          <span>Titulo *</span>
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
          <FieldError fieldName="title" errors={fieldErrors} />
        </label>

        <label className={getFieldClassName(fieldErrors.brand)} htmlFor="brand">
          <span>Marca *</span>
          <input
            aria-describedby={getErrorId("brand", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.brand)}
            defaultValue={product.brand}
            id="brand"
            name="brand"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            required
            type="text"
          />
          <FieldError fieldName="brand" errors={fieldErrors} />
        </label>

        <label
          className={getFieldClassName(fieldErrors.category)}
          htmlFor="category"
        >
          <span>Categoria *</span>
          <select
            aria-describedby={getErrorId("category", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.category)}
            defaultValue={product.category}
            id="category"
            name="category"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            required
          >
            <option value="">Seleccionar</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatCategory(category)}
              </option>
            ))}
          </select>
          <FieldError fieldName="category" errors={fieldErrors} />
        </label>

        <label className={getFieldClassName(fieldErrors.size)} htmlFor="size">
          <span>Talle *</span>
          <input
            aria-describedby={getErrorId("size", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.size)}
            className="input-uppercase"
            defaultValue={product.size}
            id="size"
            name="size"
            onBlur={onFieldBlur}
            onChange={(event) => {
              onSizeChange(event);
              onFieldChange(event);
            }}
            required
            type="text"
          />
          <FieldError fieldName="size" errors={fieldErrors} />
        </label>

        <label className={getFieldClassName(fieldErrors.price)} htmlFor="price">
          <span>Precio en pesos *</span>
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
          <FieldError fieldName="price" errors={fieldErrors} />
        </label>
      </div>

      <label
        className={getFieldClassName(fieldErrors.description)}
        htmlFor="description"
      >
        <span>Descripcion / estado *</span>
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
        <FieldError fieldName="description" errors={fieldErrors} />
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

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function FieldError({
  errors,
  fieldName,
}: {
  errors: ProductFieldErrors;
  fieldName: ProductFieldName;
}) {
  const message = errors[fieldName];

  if (!message) {
    return null;
  }

  return (
    <p className="form-field__error" id={`${fieldName}-error`} role="alert">
      {message}
    </p>
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
