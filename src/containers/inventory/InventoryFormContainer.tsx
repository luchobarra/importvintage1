"use client";

import { InventoryForm } from "@/components/inventory/InventoryForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import {
  createInventoryItemDraft,
  deleteInventoryItemDraft,
  saveInventoryItemImages,
  updateInventoryItem,
  type InventoryFormState,
} from "@/features/inventory/actions";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProductCondition,
  CatalogSize,
} from "@/features/catalog-options/types";
import { MAX_INVENTORY_IMAGES } from "@/features/inventory/constants";
import type { InventoryItem } from "@/features/inventory/types";
import {
  normalizeMoneyInput,
  validateInventoryField,
  validateInventoryFormFields,
  type InventoryFieldErrors,
  type InventoryFieldName,
} from "@/features/inventory/validation";
import { optimizeImage } from "@/features/images/optimize-image";
import type { SelectedImage, UploadProgress } from "@/features/images/types";
import { withTimeout } from "@/features/images/with-timeout";
import { sanitizeMeasurementInput } from "@/features/measurements/formatters";
import {
  calculateEstimatedSaleMetrics,
  calculateProductPrice,
} from "@/features/price-calculator/calculations";
import {
  formatCurrency,
  formatPercent,
} from "@/features/price-calculator/formatters";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";
import { formatProductPriceInput } from "@/features/products/form-validation";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import type { ChangeEvent, DragEvent, FocusEvent, FormEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

const initialState: InventoryFormState = {
  message: "",
  success: false,
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const IMAGE_STEP_TIMEOUT_MS = 45000;
const PRICE_CALCULATION_DELAY_MS = 1200;

type InventoryFormContainerProps = {
  brands: CatalogBrand[];
  categories: CatalogCategory[];
  conditions: CatalogProductCondition[];
  priceCalculatorSettings: PriceCalculatorSettings;
  item?: InventoryItem;
  mode: "create" | "edit";
  sizes: CatalogSize[];
};

type ResultState = {
  description: string;
  title: string;
  variant: ResultModalVariant;
};

type InventoryCalculationSummary = {
  estimatedProfit: string;
  margin: string;
};

export function InventoryFormContainer({
  brands,
  categories,
  conditions,
  item,
  mode,
  priceCalculatorSettings,
  sizes,
}: InventoryFormContainerProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const unsavedChangesGuard = useUnsavedChangesGuard();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedImage[]>([]);
  const [state, setState] = useState<InventoryFormState>(initialState);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<InventoryFieldErrors>({});
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [purchasePriceValue, setPurchasePriceValue] = useState(
    getInitialMoneyInputValue(item?.purchase_price),
  );
  const [estimatedSalePriceValue, setEstimatedSalePriceValue] = useState(
    getInitialMoneyInputValue(item?.estimated_sale_price),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    item?.category_id ?? "",
  );
  const [calculationSummary, setCalculationSummary] =
    useState<InventoryCalculationSummary | null>(() =>
      item?.purchase_price
        ? createInventoryCalculationSummaryFromEstimatedSalePrice({
            estimatedSalePrice:
              item.estimated_sale_price ??
              calculateProductPrice({
                acquisitionCost: item.purchase_price,
                settings: priceCalculatorSettings,
              }).finalRoundedPrice,
            priceCalculatorSettings,
            purchasePrice: item.purchase_price,
          })
        : null,
    );
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const allowImageUpload = mode === "create";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);
    setResult(null);
    setImageErrorMessage("");

    const form = formRef.current;

    if (!form) {
      return;
    }

    const validation = validateInventoryFormFields(new FormData(form));
    const imageValidationMessage =
      allowImageUpload && images.length < 1 ? "Carga al menos 1 foto." : "";

    setFieldErrors(validation.errors);
    setImageErrorMessage(imageValidationMessage);

    if (validation.firstInvalidField || imageValidationMessage) {
      setState({
        message: validation.message || imageValidationMessage,
        success: false,
      });

      if (validation.firstInvalidField) {
        focusInventoryField(form, validation.firstInvalidField);
      }

      return;
    }

    setIsConfirmOpen(true);
  }

  function handleConfirmSubmit() {
    const form = formRef.current;

    if (!form || isPending) {
      return;
    }

    setIsConfirmOpen(false);

    startTransition(async () => {
      const formData = new FormData(form);
      const normalizedPurchasePrice = normalizeMoneyInput(
        formData.get("purchase_price"),
      );
      const purchasePrice = Number(normalizedPurchasePrice);

      formData.set("purchase_price", normalizedPurchasePrice);

      let estimatedSalePrice = normalizeMoneyInput(
        formData.get("estimated_sale_price"),
      );

      if (isCalculatingPrice && purchasePrice > 0) {
        estimatedSalePrice = getCalculatedEstimatedSalePriceInput(
          purchasePrice,
          priceCalculatorSettings,
        );
      }

      formData.set("estimated_sale_price", estimatedSalePrice);

      if (mode === "edit" && item) {
        const updateResult = await updateInventoryItem(item.id, formData);

        setState(updateResult);

        if (updateResult.success) {
          unsavedChangesGuard.clearDirty();
        }

        setResult({
          description: updateResult.message,
          title: updateResult.success
            ? "Ingreso actualizado"
            : "No se pudo actualizar",
          variant: updateResult.success ? "success" : "error",
        });
        router.refresh();
        return;
      }

      await createInventoryItem(formData);
    });
  }

  async function createInventoryItem(formData: FormData) {
    let inventoryItemId = "";
    const uploadedPaths: string[] = [];

    try {
      const optimizedImages: File[] = [];

      for (const [index, image] of images.entries()) {
        setProgress({
          current: index,
          detail: `${image.file.name} (${index + 1}/${images.length})`,
          label: "Optimizando fotos",
          total: images.length,
        });

        optimizedImages.push(
          await withTimeout(
            optimizeImage(image.file, index + 1),
            IMAGE_STEP_TIMEOUT_MS,
            `La optimización de la foto ${index + 1} tardo demasiado.`,
          ),
        );
      }

      setProgress({
        current: 0,
        detail: "Creando el registro de stock.",
        label: "Guardando stock",
        total: images.length,
      });

      const draftResult = await createInventoryItemDraft(formData);

      if (!draftResult.success) {
        setState(draftResult);
        setProgress(null);
        setResult({
          description: draftResult.message,
          title: "No se pudo cargar el ingreso",
          variant: "error",
        });
        return;
      }

      inventoryItemId = draftResult.inventoryItemId;

      const uploadedImages = [];

      for (const [index, image] of optimizedImages.entries()) {
        const position = index + 1;
        const imagePath = `inventory/${inventoryItemId}/image-${position}.webp`;

        setProgress({
          current: index,
          detail: `Foto ${position}/${optimizedImages.length}`,
          label: "Subiendo fotos",
          total: optimizedImages.length,
        });

        const { error: uploadError } = await withTimeout(
          supabase.storage.from("product-images").upload(imagePath, image, {
            contentType: "image/webp",
            upsert: false,
          }),
          IMAGE_STEP_TIMEOUT_MS,
          `La subida de la foto ${position} tardo demasiado.`,
        );

        if (uploadError) {
          throw new Error(
            `No se pudo subir la foto ${position}: ${uploadError.message}`,
          );
        }

        uploadedPaths.push(imagePath);

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(imagePath);

        uploadedImages.push({
          imagePath,
          imageUrl: publicUrl,
          position,
        });
      }

      const imageResult = await saveInventoryItemImages(
        inventoryItemId,
        uploadedImages,
      );

      if (!imageResult.success) {
        throw new Error(imageResult.message);
      }

      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setImages([]);
      formRef.current?.reset();
      unsavedChangesGuard.clearDirty();
      setFieldErrors({});
      setProgress(null);
      setState({
        message: "Ingreso cargado correctamente.",
        success: true,
      });
      setResult({
        description:
          "El producto quedó guardado en stock y listo para seguimiento.",
        title: "Ingreso cargado",
        variant: "success",
      });
      router.push("/retro-campus-admin/stock");
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("product-images").remove(uploadedPaths);
      }

      if (inventoryItemId) {
        await deleteInventoryItemDraft(inventoryItemId);
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar la carga del ingreso.";

      setProgress(null);
      setState({
        message,
        success: false,
      });
      setResult({
        description: message,
        title: "No se pudo cargar el ingreso",
        variant: "error",
      });
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    unsavedChangesGuard.markDirty();
    const nextValue = formatProductPriceInput(event.target.value);

    if (event.currentTarget.name === "purchase_price") {
      setPurchasePriceValue(nextValue);
      const nextPurchasePrice = Number(normalizeMoneyInput(nextValue));

      if (!Number.isFinite(nextPurchasePrice) || nextPurchasePrice <= 0) {
        setCalculationSummary(null);
        setEstimatedSalePriceValue("");
        setIsCalculatingPrice(false);
      } else {
        setIsCalculatingPrice(true);
      }
    } else if (event.currentTarget.name === "estimated_sale_price") {
      setEstimatedSalePriceValue(nextValue);
      setIsCalculatingPrice(false);
      setCalculationSummary(
        createInventoryCalculationSummaryFromInputValues({
          estimatedSalePriceValue: nextValue,
          priceCalculatorSettings,
          purchasePriceValue,
        }),
      );
    }

    clearFieldErrorWhenValid(event.currentTarget.name, nextValue);
  }

  function handleMeasurementChange(event: ChangeEvent<HTMLInputElement>) {
    unsavedChangesGuard.markDirty();
    event.target.value = sanitizeMeasurementInput(event.target.value);
    clearFieldErrorWhenValid(event.currentTarget.name, event.currentTarget.value);
  }

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    unsavedChangesGuard.markDirty();

    if (event.currentTarget.name === "category_id") {
      setSelectedCategoryId(event.currentTarget.value);
    }

    clearFieldErrorWhenValid(
      event.currentTarget.name,
      event.currentTarget.value,
    );
  }

  function handleDateChange(fieldName: string, value: string) {
    unsavedChangesGuard.markDirty();
    clearFieldErrorWhenValid(fieldName, value);
  }

  function handleDateBlur(fieldName: string, value: string) {
    validateFieldOnBlur(fieldName, value);
  }

  function handleFieldBlur(
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    validateFieldOnBlur(event.currentTarget.name, event.currentTarget.value);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function addFiles(files: File[]) {
    setState(initialState);
    setResult(null);
    setImageErrorMessage("");

    const acceptedFiles = files.filter((file) =>
      ACCEPTED_IMAGE_TYPES.includes(file.type),
    );
    const oversizedFiles = acceptedFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );
    const imageFiles = acceptedFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE_BYTES,
    );

    if (acceptedFiles.length !== files.length) {
      setImageErrorMessage("Solo se aceptan imágenes JPG, PNG o WebP.");
    }

    if (oversizedFiles.length > 0) {
      setImageErrorMessage(
        `Cada foto debe pesar como máximo ${MAX_FILE_SIZE_MB} MB antes de optimizar.`,
      );
    }

    if (imageFiles.length === 0) {
      return;
    }

    unsavedChangesGuard.markDirty();

    setImages((currentImages) => {
      const availableSlots = MAX_INVENTORY_IMAGES - currentImages.length;

      if (availableSlots <= 0) {
        setImageErrorMessage(
          `Ya cargaste el máximo permitido de ${MAX_INVENTORY_IMAGES} fotos.`,
        );
        return currentImages;
      }

      const selectedFiles = imageFiles.slice(0, availableSlots);

      if (imageFiles.length > availableSlots) {
        setImageErrorMessage(
          `Se agregaron solo las fotos que entran en el máximo de ${MAX_INVENTORY_IMAGES}.`,
        );
      }

      const newImages = selectedFiles.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        previewUrl: URL.createObjectURL(file),
      }));

      return [...currentImages, ...newImages];
    });
  }

  function removeImage(imageId: string) {
    setResult(null);
    setImageErrorMessage("");
    unsavedChangesGuard.markDirty();
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  }

  function validateFieldOnBlur(fieldName: string, value: string) {
    if (!isInventoryFieldName(fieldName)) {
      return;
    }

    const fieldError = validateInventoryField(fieldName, value);

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

  function clearFieldErrorWhenValid(fieldName: string, value: string) {
    if (!isInventoryFieldName(fieldName)) {
      return;
    }

    if (validateInventoryField(fieldName, value)) {
      return;
    }

    setState(initialState);
    setFieldErrors((currentErrors) => {
      if (!Object.prototype.hasOwnProperty.call(currentErrors, fieldName)) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName as keyof InventoryFieldErrors];
      return nextErrors;
    });
  }

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (!isCalculatingPrice) {
      return;
    }

    const acquisitionCost = Number(normalizeMoneyInput(purchasePriceValue));

    if (!Number.isFinite(acquisitionCost) || acquisitionCost <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const calculation = calculateProductPrice({
        acquisitionCost,
        settings: priceCalculatorSettings,
      });

      setEstimatedSalePriceValue(
        formatProductPriceInput(String(calculation.finalRoundedPrice)),
      );
      setCalculationSummary(
        createInventoryCalculationSummaryFromEstimatedSalePrice({
          estimatedSalePrice: calculation.finalRoundedPrice,
          priceCalculatorSettings,
          purchasePrice: acquisitionCost,
        }),
      );
      setIsCalculatingPrice(false);
    }, PRICE_CALCULATION_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isCalculatingPrice, priceCalculatorSettings, purchasePriceValue]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  return (
    <>
      {unsavedChangesGuard.dialog}
      <InventoryForm
        allowImageUpload={allowImageUpload}
        brands={brands}
        categories={categories}
        conditions={conditions}
        calculationSummary={calculationSummary}
        fieldErrors={fieldErrors}
        fileInputRef={fileInputRef}
        formRef={formRef}
        imageFeedbackMessage={imageErrorMessage}
        imageFeedbackVariant={imageErrorMessage ? "error" : "info"}
        images={images}
        isDragging={isDragging}
        isPriceCalculationPending={isCalculatingPrice}
        isPending={isPending}
        onDragChange={setIsDragging}
        onDateChange={handleDateChange}
        onDateBlur={handleDateBlur}
        onDrop={handleDrop}
        onFieldBlur={handleFieldBlur}
        onFieldChange={handleFieldChange}
        onFileChange={handleFileChange}
        onMeasurementChange={handleMeasurementChange}
        onPriceChange={handlePriceChange}
        onRemoveImage={removeImage}
        onSubmit={handleSubmit}
        selectedCategoryId={selectedCategoryId}
        sizes={sizes}
        stateMessage={state.success ? "" : state.message}
        values={{
          brand_id: item?.brand_id ?? "",
          category_id: item?.category_id ?? "",
          condition_notes: item?.condition_notes ?? "",
          condition_id: item?.condition_id ?? "",
          estimated_sale_price: item?.estimated_sale_price ?? null,
          height_cm: item?.height_cm ?? null,
          internal_description: item?.internal_description ?? "",
          internal_notes: item?.internal_notes ?? "",
          purchase_date: item?.purchase_date ?? "",
          purchase_price: item?.purchase_price ?? null,
          purchase_price_input: purchasePriceValue,
          estimated_sale_price_input: estimatedSalePriceValue,
          size_id: item?.size_id ?? "",
          title: item?.title ?? "",
          visible_id: item?.visible_id ?? "",
          width_cm: item?.width_cm ?? null,
        }}
      />
      <ConfirmDialog
        confirmLabel={mode === "edit" ? "Guardar cambios" : "Guardar ingreso"}
        description={
          mode === "edit"
            ? "Se actualizará la información del ingreso con los datos cargados."
            : "Se creará el ingreso de stock y se subirán sus fotos."
        }
        isOpen={isConfirmOpen}
        isPending={isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title={mode === "edit" ? "Confirmar cambios" : "Confirmar ingreso"}
      />
      <LoadingOverlay
        isVisible={isPending || progress !== null}
        message={getInventoryLoadingMessage(progress)}
      />
      <ResultModal
        autoCloseMs={8000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={() => setResult(null)}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );
}

function getInitialMoneyInputValue(value: number | null | undefined) {
  return typeof value === "number"
    ? formatProductPriceInput(String(Math.round(value)))
    : "";
}

function createInventoryCalculationSummary(
  calculation: ReturnType<typeof calculateEstimatedSaleMetrics>,
): InventoryCalculationSummary {
  return {
    estimatedProfit: formatCurrency(
      calculation.contributionMarginWithCommission,
    ),
    margin: formatPercent(calculation.contributionMarginWithCommissionRate),
  };
}

function createInventoryCalculationSummaryFromInputValues({
  estimatedSalePriceValue,
  priceCalculatorSettings,
  purchasePriceValue,
}: {
  estimatedSalePriceValue: string;
  priceCalculatorSettings: PriceCalculatorSettings;
  purchasePriceValue: string;
}) {
  const purchasePrice = Number(normalizeMoneyInput(purchasePriceValue));
  const estimatedSalePrice = Number(normalizeMoneyInput(estimatedSalePriceValue));

  if (
    !Number.isFinite(purchasePrice) ||
    purchasePrice <= 0 ||
    !Number.isFinite(estimatedSalePrice) ||
    estimatedSalePrice <= 0
  ) {
    return null;
  }

  return createInventoryCalculationSummaryFromEstimatedSalePrice({
    estimatedSalePrice,
    priceCalculatorSettings,
    purchasePrice,
  });
}

function createInventoryCalculationSummaryFromEstimatedSalePrice({
  estimatedSalePrice,
  priceCalculatorSettings,
  purchasePrice,
}: {
  estimatedSalePrice: number;
  priceCalculatorSettings: PriceCalculatorSettings;
  purchasePrice: number;
}) {
  return createInventoryCalculationSummary(
    calculateEstimatedSaleMetrics({
      acquisitionCost: purchasePrice,
      estimatedSalePrice,
      settings: priceCalculatorSettings,
    }),
  );
}

function getCalculatedEstimatedSalePriceInput(
  purchasePrice: number,
  settings: PriceCalculatorSettings,
) {
  const calculation = calculateProductPrice({
    acquisitionCost: purchasePrice,
    settings,
  });

  return String(calculation.finalRoundedPrice);
}

function getInventoryLoadingMessage(progress: UploadProgress | null) {
  if (!progress) {
    return "Guardando ingreso...";
  }

  return `${progress.label}: ${progress.detail}`;
}

function focusInventoryField(form: HTMLFormElement, fieldName: string) {
  const field = form.elements.namedItem(fieldName);

  if (field instanceof HTMLElement) {
    field.focus();
  }
}

function isInventoryFieldName(fieldName: string): fieldName is InventoryFieldName {
  return [
    "title",
    "brand_id",
    "category_id",
    "size_id",
    "condition_id",
    "purchase_date",
    "purchase_price",
    "estimated_sale_price",
    "height_cm",
    "width_cm",
    "internal_description",
    "internal_notes",
  ].includes(fieldName);
}
