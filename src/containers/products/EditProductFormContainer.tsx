"use client";

import { EditProductForm } from "@/components/products/EditProductForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import {
  updateProduct,
  type ProductFormState,
} from "@/features/products/actions";
import type { CatalogOptions } from "@/features/catalog-options/types";
import {
  formatProductPriceInput,
  getPriceDigits,
  validateProductField,
  validateProductFormFields,
  type ProductFieldErrors,
  type ProductFieldName,
} from "@/features/products/form-validation";
import type { Product } from "@/features/products/types";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useRef, useState, useTransition } from "react";

const initialState: ProductFormState = {
  message: "",
  success: false,
};

type ResultState = {
  description: string;
  shouldRedirect: boolean;
  title: string;
  variant: ResultModalVariant;
};

type EditProductFormContainerProps = {
  options: CatalogOptions;
  product: Product;
};

export function EditProductFormContainer({
  options,
  product,
}: EditProductFormContainerProps) {
  const router = useRouter();
  const initialCategoryId = getInitialCategoryId(product, options);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ProductFormState>(initialState);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [descriptionLength, setDescriptionLength] = useState(
    product.description?.length ?? 0,
  );
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(initialCategoryId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);
    setResult(null);

    const form = formRef.current;

    if (!form) {
      return;
    }

    const validation = validateProductFormFields(new FormData(form));

    if (validation.firstInvalidField) {
      setFieldErrors(validation.errors);
      setState({
        message: validation.message,
        success: false,
      });
      focusProductField(form, validation.firstInvalidField);
      return;
    }

    setFieldErrors({});
    setIsConfirmOpen(true);
  }

  function handleConfirmSubmit() {
    const form = formRef.current;

    if (!form || isPending) {
      return;
    }

    setIsConfirmOpen(false);

    const formData = new FormData(form);
    formData.set(
      "price",
      getPriceDigits(String(formData.get("price") ?? "")),
    );

    startTransition(async () => {
      const actionResult = await updateProduct(product.id, formData);
      setState(actionResult);

      if (actionResult.success) {
        setResult({
          description:
            "Los cambios se guardaron correctamente. Vas a volver al listado de productos.",
          shouldRedirect: true,
          title: "Producto actualizado",
          variant: "success",
        });
        return;
      }

      setResult({
        description: actionResult.message,
        shouldRedirect: false,
        title: "No se pudo actualizar el producto",
        variant: "error",
      });
    });
  }

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    event.target.value = formatProductPriceInput(event.target.value);
    handleFieldChange(event);
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCategoryId(event.currentTarget.value);
    handleFieldChange(event);
  }

  function handleFieldChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    if (event.currentTarget.name === "description") {
      setDescriptionLength(event.currentTarget.value.length);
    }

    clearFieldErrorWhenFilled(
      event.currentTarget.name,
      event.currentTarget.value,
    );
  }

  function handleFieldBlur(
    event: FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const fieldName = event.currentTarget.name;

    if (!isProductFieldName(fieldName)) {
      return;
    }

    const fieldError = validateProductField(
      fieldName,
      event.currentTarget.value,
    );

    if (!fieldError) {
      setState(initialState);
    }

    setFieldErrors((currentErrors) => {
      if (fieldError) {
        return {
          ...currentErrors,
          [fieldName]: fieldError,
        };
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  function clearFieldErrorWhenFilled(fieldName: string, value: string) {
    if (!isProductFieldName(fieldName) || !value.trim()) {
      return;
    }

    setState(initialState);
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  function handleCloseResult() {
    const shouldRedirect = result?.shouldRedirect === true;

    setResult(null);

    if (shouldRedirect) {
      router.push("/oldtimes-admin/productos");
    }
  }

  return (
    <>
      <EditProductForm
        descriptionLength={descriptionLength}
        fieldErrors={fieldErrors}
        formRef={formRef}
        initialBrandId={getInitialBrandId(product, options)}
        initialCategoryId={initialCategoryId}
        initialConditionId={getInitialConditionId(product, options)}
        initialSizeId={getInitialSizeId(product, options)}
        isPending={isPending}
        onCategoryChange={handleCategoryChange}
        onFieldBlur={handleFieldBlur}
        onFieldChange={handleFieldChange}
        onPriceChange={handlePriceChange}
        onSubmit={handleSubmit}
        options={options}
        product={product}
        selectedCategoryId={selectedCategoryId}
        state={state}
      />
      <ConfirmDialog
        confirmLabel="Guardar cambios"
        description="Se actualizaran los datos del producto en el catalogo."
        isOpen={isConfirmOpen}
        isPending={isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirmar cambios"
      />
      <LoadingOverlay isVisible={isPending} message="Guardando cambios..." />
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

function isProductFieldName(fieldName: string): fieldName is ProductFieldName {
  return [
    "title",
    "brand",
    "category",
    "condition",
    "size",
    "price",
    "description",
  ].includes(fieldName);
}

function focusProductField(form: HTMLFormElement, fieldName: ProductFieldName) {
  const field = form.elements.namedItem(fieldName);

  if (field instanceof HTMLElement) {
    field.focus();
  }
}

function getInitialBrandId(product: Product, options: CatalogOptions) {
  if (product.brand_id) {
    return product.brand_id;
  }

  return (
    options.brands.find(
      (brand) => normalizeOptionValue(brand.name) === normalizeOptionValue(product.brand),
    )?.id ?? ""
  );
}

function getInitialCategoryId(product: Product, options: CatalogOptions) {
  if (product.category_id) {
    return product.category_id;
  }

  return (
    options.categories.find(
      (category) =>
        normalizeOptionValue(category.slug) === normalizeOptionValue(product.category) ||
        normalizeOptionValue(category.name) === normalizeOptionValue(product.category),
    )?.id ?? ""
  );
}

function getInitialSizeId(product: Product, options: CatalogOptions) {
  if (product.size_id) {
    return product.size_id;
  }

  return (
    options.sizes.find(
      (size) => normalizeOptionValue(size.value) === normalizeOptionValue(product.size),
    )?.id ?? ""
  );
}

function getInitialConditionId(product: Product, options: CatalogOptions) {
  if (product.condition_id) {
    return product.condition_id;
  }

  return (
    options.conditions.find(
      (condition) =>
        normalizeOptionValue(condition.name) === normalizeOptionValue(product.condition),
    )?.id ?? ""
  );
}

function normalizeOptionValue(value: string) {
  return value.trim().toLowerCase();
}
