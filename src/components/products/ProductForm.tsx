import { ImageUploader } from "@/components/products/ImageUploader";
import type { SelectedImage } from "@/features/images/types";
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
  isDragging: boolean;
  isPending: boolean;
  state: ProductFormState;
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
  onPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (imageId: string) => void;
  onSizeChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
  isDragging,
  isPending,
  state,
  onDragChange,
  onDrop,
  onFieldBlur,
  onFieldChange,
  onFileChange,
  onPriceChange,
  onRemoveImage,
  onSizeChange,
  onSubmit,
}: ProductFormProps) {
  return (
    <form className="product-form" noValidate onSubmit={onSubmit} ref={formRef}>
      <div className="product-form__grid">
        <label className={getFieldClassName(fieldErrors.title)} htmlFor="title">
          <span>Titulo *</span>
          <input
            aria-describedby={getErrorId("title", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.title)}
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
            id="category"
            name="category"
            onBlur={onFieldBlur}
            onChange={onFieldChange}
            required
          >
            <option value="">Seleccionar</option>
            <option value="pantalones">Pantalones</option>
            <option value="buzos">Buzos</option>
            <option value="polar">Polar</option>
          </select>
          <FieldError fieldName="category" errors={fieldErrors} />
        </label>

        <label className={getFieldClassName(fieldErrors.size)} htmlFor="size">
          <span>Talle *</span>
          <input
            aria-describedby={getErrorId("size", fieldErrors)}
            aria-invalid={Boolean(fieldErrors.size)}
            className="input-uppercase"
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

      <ImageUploader
        disabled={isPending}
        fileInputRef={fileInputRef}
        feedbackMessage={imageFeedbackMessage}
        feedbackVariant={imageFeedbackVariant}
        images={images}
        isAddDisabled={images.length >= MAX_PRODUCT_IMAGES}
        isDragging={isDragging}
        onDragChange={onDragChange}
        onDrop={onDrop}
        onFileChange={onFileChange}
        onRemoveImage={onRemoveImage}
      />

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
