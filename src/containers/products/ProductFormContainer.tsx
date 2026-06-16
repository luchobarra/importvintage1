"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import { ProductForm } from "@/components/products/ProductForm";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CatalogOptions } from "@/features/catalog-options/types";
import { optimizeImage } from "@/features/images/optimize-image";
import type { SelectedImage, UploadProgress } from "@/features/images/types";
import { withTimeout } from "@/features/images/with-timeout";
import {
  createProductDraft,
  deleteProductDraft,
  saveProductImages,
  type ProductFormState,
} from "@/features/products/actions";
import { MAX_PRODUCT_IMAGES } from "@/features/products/constants";
import {
  formatProductPriceInput,
  getPriceDigits,
  validateProductField,
  validateProductFormFields,
  type ProductFieldErrors,
  type ProductFieldName,
} from "@/features/products/form-validation";
import { useRouter } from "next/navigation";
import type { ChangeEvent, DragEvent, FocusEvent, FormEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

const initialState: ProductFormState = {
  message: "",
  success: false,
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const IMAGE_STEP_TIMEOUT_MS = 45000;

type ResultState = {
  description: string;
  title: string;
  variant: ResultModalVariant;
};

type ProductFormContainerProps = {
  options: CatalogOptions;
};

export function ProductFormContainer({ options }: ProductFormContainerProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedImage[]>([]);
  const [state, setState] = useState<ProductFormState>(initialState);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);
    setResult(null);
    setImageErrorMessage("");

    const form = formRef.current;

    if (!form) {
      return;
    }

    const validation = validateProductFormFields(new FormData(form));
    const imageValidationMessage =
      images.length < 1 ? "Carga al menos 1 imagen." : "";

    setFieldErrors(validation.errors);
    setImageErrorMessage(imageValidationMessage);

    if (validation.firstInvalidField || imageValidationMessage) {
      setState({
        message: validation.message,
        success: false,
      });

      if (validation.firstInvalidField) {
        focusProductField(form, validation.firstInvalidField);
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
      formData.set(
        "price",
        getPriceDigits(String(formData.get("price") ?? "")),
      );
      let productId = "";
      const uploadedPaths: string[] = [];

      try {
        const optimizedImages: File[] = [];

        for (const [index, image] of images.entries()) {
          setProgress({
            label: "Optimizando imagenes",
            detail: `${image.file.name} (${index + 1}/${images.length})`,
            current: index,
            total: images.length,
          });

          optimizedImages.push(
            await withTimeout(
              optimizeImage(image.file, index + 1),
              IMAGE_STEP_TIMEOUT_MS,
              `La optimizacion de la imagen ${index + 1} tardo demasiado.`,
            ),
          );
        }

        setProgress({
          label: "Guardando producto",
          detail: "Creando el registro en la base de datos.",
          current: 0,
          total: images.length,
        });

        const draftResult = await createProductDraft(formData);

        if (!draftResult.success) {
          setState(draftResult);
          setProgress(null);
          setResult({
            description: draftResult.message,
            title: "No se pudo cargar el producto",
            variant: "error",
          });
          return;
        }

        productId = draftResult.productId;

        const uploadedImages = [];

        for (const [index, image] of optimizedImages.entries()) {
          const position = index + 1;
          const imagePath = `products/${productId}/image-${position}.webp`;

          setProgress({
            label: "Subiendo imagenes",
            detail: `Imagen ${position}/${optimizedImages.length}`,
            current: index,
            total: optimizedImages.length,
          });

          const { error: uploadError } = await withTimeout(
            supabase.storage.from("product-images").upload(imagePath, image, {
              contentType: "image/webp",
              upsert: false,
            }),
            IMAGE_STEP_TIMEOUT_MS,
            `La subida de la imagen ${position} tardo demasiado.`,
          );

          if (uploadError) {
            throw new Error(
              `No se pudo subir la imagen ${position}: ${uploadError.message}`,
            );
          }

          uploadedPaths.push(imagePath);

          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(imagePath);

          uploadedImages.push({
            imageUrl: publicUrl,
            imagePath,
            position,
          });
        }

        setProgress({
          label: "Finalizando carga",
          detail: "Guardando el orden de las imagenes.",
          current: images.length,
          total: images.length,
        });

        const imageResult = await saveProductImages(productId, uploadedImages);

        if (!imageResult.success) {
          throw new Error(imageResult.message);
        }

        setProgress({
          label: "Producto cargado",
          detail: "La carga finalizo correctamente.",
          current: images.length,
          total: images.length,
        });

        images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setImages([]);
        form.reset();
        setSelectedCategoryId("");
        setDescriptionLength(0);
        setFieldErrors({});
        setProgress(null);
        setState({
          message: "Producto cargado correctamente.",
          success: true,
        });
        setResult({
          description:
            "El producto se creo correctamente y las imagenes quedaron guardadas.",
          title: "Producto cargado",
          variant: "success",
        });
        router.refresh();
      } catch (error) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("product-images").remove(uploadedPaths);
        }

        if (productId) {
          await deleteProductDraft(productId);
        }

        setProgress(null);
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo completar la carga del producto.";

        setState({
          message,
          success: false,
        });
        setResult({
          description: message,
          title: "No se pudo cargar el producto",
          variant: "error",
        });
      }
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
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
      const message = "Solo se aceptan imagenes JPG, PNG o WebP.";
      setImageErrorMessage(message);
    }

    if (oversizedFiles.length > 0) {
      const message = `Cada imagen debe pesar como maximo ${MAX_FILE_SIZE_MB} MB antes de optimizar.`;
      setImageErrorMessage(message);
    }

    if (imageFiles.length === 0) {
      return;
    }

    setImages((currentImages) => {
      const availableSlots = MAX_PRODUCT_IMAGES - currentImages.length;

      if (availableSlots <= 0) {
        const message = "Ya cargaste el maximo permitido de 5 imagenes.";
        setImageErrorMessage(message);
        return currentImages;
      }

      const selectedFiles = imageFiles.slice(0, availableSlots);

      if (imageFiles.length > availableSlots) {
        const message = "Se agregaron solo las imagenes que entran en el maximo de 5.";
        setImageErrorMessage(message);
      }

      const newImages = selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
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

  function handleCloseResult() {
    setState(initialState);
    setResult(null);
  }

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  return (
    <>
      <ProductForm
        descriptionLength={descriptionLength}
        fieldErrors={fieldErrors}
        fileInputRef={fileInputRef}
        formRef={formRef}
        imageFeedbackMessage={getProductImageFeedbackMessage({
          imageErrorMessage,
          imageCount: images.length,
        })}
        imageFeedbackVariant={imageErrorMessage ? "error" : "info"}
        images={images}
        isDragging={isDragging}
        isPending={isPending}
        onCategoryChange={handleCategoryChange}
        onDragChange={setIsDragging}
        onDrop={handleDrop}
        onFieldBlur={handleFieldBlur}
        onFieldChange={handleFieldChange}
        onFileChange={handleFileChange}
        onPriceChange={handlePriceChange}
        onRemoveImage={removeImage}
        onSubmit={handleSubmit}
        options={options}
        selectedCategoryId={selectedCategoryId}
        state={state}
      />
      <ConfirmDialog
        confirmLabel="Cargar producto"
        description="Se creara el producto y se subiran sus imagenes al catalogo."
        isOpen={isConfirmOpen}
        isPending={isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirmar carga de producto"
      />
      <LoadingOverlay
        isVisible={isPending || progress !== null}
        message={getProductFormLoadingMessage(progress)}
      />
      <ResultModal
        autoCloseMs={3000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={handleCloseResult}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );
}

function getProductFormLoadingMessage(progress: UploadProgress | null) {
  if (!progress) {
    return "Cargando producto...";
  }

  return `${progress.label}: ${progress.detail}`;
}

function isProductFieldName(fieldName: string): fieldName is ProductFieldName {
  return [
    "title",
    "brand",
    "category",
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

function getProductImageFeedbackMessage({
  imageCount,
  imageErrorMessage,
}: {
  imageCount: number;
  imageErrorMessage: string;
}) {
  if (imageErrorMessage) {
    return imageErrorMessage;
  }

  if (imageCount >= MAX_PRODUCT_IMAGES) {
    return "Ya cargaste las 5 imagenes permitidas para este producto.";
  }

  return "";
}
