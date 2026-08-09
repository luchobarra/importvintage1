"use client";

import { InventoryForm } from "@/components/inventory/InventoryForm";
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
} from "@/features/catalog-options/types";
import { MAX_INVENTORY_IMAGES } from "@/features/inventory/constants";
import { getTodayDateInputValue } from "@/features/inventory/formatters";
import type { InventoryItem } from "@/features/inventory/types";
import {
  normalizeMoneyInput,
  validateInventoryFormFields,
  type InventoryFieldErrors,
} from "@/features/inventory/validation";
import { optimizeImage } from "@/features/images/optimize-image";
import type { SelectedImage, UploadProgress } from "@/features/images/types";
import { withTimeout } from "@/features/images/with-timeout";
import { calculateProductPrice } from "@/features/price-calculator/calculations";
import {
  formatCurrency,
  formatPercent,
} from "@/features/price-calculator/formatters";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";
import { formatProductPriceInput } from "@/features/products/form-validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
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
}: InventoryFormContainerProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedImage[]>([]);
  const [state, setState] = useState<InventoryFormState>(initialState);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<InventoryFieldErrors>({});
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [purchasePriceValue, setPurchasePriceValue] = useState(
    getInitialMoneyInputValue(item?.purchase_price),
  );
  const [estimatedSalePriceValue, setEstimatedSalePriceValue] = useState(
    getInitialMoneyInputValue(item?.estimated_sale_price),
  );
  const [calculationSummary, setCalculationSummary] =
    useState<InventoryCalculationSummary | null>(() =>
      item?.purchase_price
        ? createInventoryCalculationSummary(
            calculateProductPrice({
              acquisitionCost: item.purchase_price,
              settings: priceCalculatorSettings,
            }),
          )
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
            `La optimizacion de la foto ${index + 1} tardo demasiado.`,
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
      setFieldErrors({});
      setProgress(null);
      setState({
        message: "Ingreso cargado correctamente.",
        success: true,
      });
      setResult({
        description:
          "El producto quedo guardado en stock y listo para seguimiento.",
        title: "Ingreso cargado",
        variant: "success",
      });
      router.push("/oldtimes-admin/stock");
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
    }

    clearFieldError(event.currentTarget.name);
  }

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    clearFieldError(event.currentTarget.name);
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
      setImageErrorMessage("Solo se aceptan imagenes JPG, PNG o WebP.");
    }

    if (oversizedFiles.length > 0) {
      setImageErrorMessage(
        `Cada foto debe pesar como maximo ${MAX_FILE_SIZE_MB} MB antes de optimizar.`,
      );
    }

    if (imageFiles.length === 0) {
      return;
    }

    setImages((currentImages) => {
      const availableSlots = MAX_INVENTORY_IMAGES - currentImages.length;

      if (availableSlots <= 0) {
        setImageErrorMessage(
          `Ya cargaste el maximo permitido de ${MAX_INVENTORY_IMAGES} fotos.`,
        );
        return currentImages;
      }

      const selectedFiles = imageFiles.slice(0, availableSlots);

      if (imageFiles.length > availableSlots) {
        setImageErrorMessage(
          `Se agregaron solo las fotos que entran en el maximo de ${MAX_INVENTORY_IMAGES}.`,
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
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  }

  function clearFieldError(fieldName: string) {
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
        createInventoryCalculationSummary(calculation),
      );
      setIsCalculatingPrice(false);
    }, PRICE_CALCULATION_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [priceCalculatorSettings, purchasePriceValue]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  return (
    <>
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
        onDateChange={clearFieldError}
        onDrop={handleDrop}
        onFieldChange={handleFieldChange}
        onFileChange={handleFileChange}
        onPriceChange={handlePriceChange}
        onRemoveImage={removeImage}
        onSubmit={handleSubmit}
        stateMessage={state.success ? "" : state.message}
        values={{
          brand_id: item?.brand_id ?? "",
          category_id: item?.category_id ?? "",
          condition_notes: item?.condition_notes ?? "",
          condition_id: item?.condition_id ?? "",
          estimated_sale_price: item?.estimated_sale_price ?? null,
          internal_description: item?.internal_description ?? "",
          internal_notes: item?.internal_notes ?? "",
          purchase_date: item?.purchase_date ?? getTodayDateInputValue(),
          purchase_price: item?.purchase_price ?? null,
          purchase_price_input: purchasePriceValue,
          estimated_sale_price_input: estimatedSalePriceValue,
          title: item?.title ?? "",
          visible_id: item?.visible_id ?? "",
        }}
      />
      <LoadingOverlay
        isVisible={isPending || progress !== null}
        message={getInventoryLoadingMessage(progress)}
      />
      <ResultModal
        autoCloseMs={7000}
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
  calculation: ReturnType<typeof calculateProductPrice>,
): InventoryCalculationSummary {
  return {
    estimatedProfit: formatCurrency(
      calculation.contributionMarginWithCommission,
    ),
    margin: formatPercent(calculation.contributionMarginWithCommissionRate),
  };
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
