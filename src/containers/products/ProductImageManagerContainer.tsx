"use client";

import { ProductImageManager } from "@/components/products/ProductImageManager";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import { optimizeImage } from "@/features/images/optimize-image";
import type { SelectedImage } from "@/features/images/types";
import { withTimeout } from "@/features/images/with-timeout";
import {
  appendProductImages,
  deleteProductImage,
  updateProductImagePositions,
} from "@/features/products/actions";
import { MAX_PRODUCT_IMAGES } from "@/features/products/constants";
import { reorderItemsById } from "@/features/products/reorder-items";
import type { ProductImage } from "@/features/products/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

type ProductImageManagerContainerProps = {
  images: ProductImage[];
  productId: string;
};

type ImageConfirmAction =
  | { type: "delete"; imageId: string }
  | { type: "save-order" }
  | { type: "upload" };

type ResultState = {
  description: string;
  shouldRefresh: boolean;
  title: string;
  variant: ResultModalVariant;
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const IMAGE_STEP_TIMEOUT_MS = 45000;

export function ProductImageManagerContainer({
  images,
  productId,
}: ProductImageManagerContainerProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isSaveOrderPending, startSaveOrderTransition] = useTransition();
  const [isUploadPending, startUploadTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [orderedImages, setOrderedImages] = useState<ProductImage[]>(images);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [confirmAction, setConfirmAction] = useState<ImageConfirmAction | null>(
    null,
  );
  const [uploadMessage, setUploadMessage] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);

  function handleStartEditImages() {
    setErrorMessage("");
    setResult(null);
    setOrderedImages(images);
    setIsEditingImages(true);
  }

  function handleCancelEditImages() {
    setErrorMessage("");
    setResult(null);
    setOrderedImages(images);
    setIsEditingImages(false);
  }

  function handleSortImages(activeImageId: string, overImageId: string) {
    setOrderedImages((currentImages) => {
      return reorderItemsById(currentImages, activeImageId, overImageId);
    });
  }

  function handleSaveImageOrder() {
    setErrorMessage("");
    setResult(null);
    setConfirmAction({ type: "save-order" });
  }

  function executeSaveImageOrder() {
    if (isSaveOrderPending) {
      return;
    }

    setConfirmAction(null);

    const imagePositions = orderedImages.map((image, index) => ({
      id: image.id,
      position: index + 1,
    }));

    startSaveOrderTransition(async () => {
      const actionResult = await updateProductImagePositions(
        productId,
        imagePositions,
      );

      if (!actionResult.success) {
        setResult({
          description: actionResult.message,
          shouldRefresh: false,
          title: "No se pudo guardar el orden",
          variant: "error",
        });
        return;
      }

      setIsEditingImages(false);
      setResult({
        description: actionResult.message,
        shouldRefresh: true,
        title: "Orden guardado",
        variant: "success",
      });
    });
  }

  function handleDeleteImage(imageId: string) {
    setErrorMessage("");
    setResult(null);
    setConfirmAction({ type: "delete", imageId });
  }

  function executeDeleteImage(imageId: string) {
    if (isDeletePending) {
      return;
    }

    setConfirmAction(null);

    startDeleteTransition(async () => {
      const actionResult = await deleteProductImage(productId, imageId);

      if (!actionResult.success) {
        setResult({
          description: actionResult.message,
          shouldRefresh: false,
          title: "No se pudo eliminar la imagen",
          variant: "error",
        });
        return;
      }

      setOrderedImages((currentImages) =>
        currentImages.filter((image) => image.id !== imageId),
      );
      setResult({
        description: actionResult.message,
        shouldRefresh: true,
        title: "Imagen eliminada",
        variant: "success",
      });
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function addFiles(files: File[]) {
    setErrorMessage("");
    setResult(null);

    if (images.length >= MAX_PRODUCT_IMAGES) {
      setErrorMessage("El producto ya tiene el maximo de 5 imagenes.");
      return;
    }

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
      setErrorMessage("Solo se aceptan imagenes JPG, PNG o WebP.");
    }

    if (oversizedFiles.length > 0) {
      setErrorMessage(
        `Cada imagen debe pesar como maximo ${MAX_FILE_SIZE_MB} MB antes de optimizar.`,
      );
    }

    if (imageFiles.length === 0) {
      return;
    }

    setSelectedImages((currentImages) => {
      const availableSlots =
        MAX_PRODUCT_IMAGES - images.length - currentImages.length;

      if (availableSlots <= 0) {
        setErrorMessage("El producto puede tener como maximo 5 imagenes.");
        return currentImages;
      }

      const selectedFiles = imageFiles.slice(0, availableSlots);

      if (imageFiles.length > availableSlots) {
        setErrorMessage(
          "Se agregaron solo las imagenes que entran en el maximo de 5.",
        );
      }

      const newImages = selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      return [...currentImages, ...newImages];
    });
  }

  function handleRemoveSelectedImage(imageId: string) {
    setSelectedImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  }

  function handleUploadImages() {
    setErrorMessage("");
    setResult(null);

    if (selectedImages.length < 1) {
      setErrorMessage("Selecciona al menos 1 imagen para subir.");
      return;
    }

    if (images.length + selectedImages.length > MAX_PRODUCT_IMAGES) {
      setErrorMessage("El producto puede tener como maximo 5 imagenes.");
      return;
    }

    setConfirmAction({ type: "upload" });
  }

  function executeUploadImages() {
    if (isUploadPending) {
      return;
    }

    setConfirmAction(null);

    startUploadTransition(async () => {
      const uploadedPaths: string[] = [];

      try {
        const uploadedImages = [];

        for (const [index, selectedImage] of selectedImages.entries()) {
          const position = images.length + index + 1;
          setUploadMessage(
            `Optimizando imagen ${index + 1}/${selectedImages.length}...`,
          );
          const optimizedImage = await withTimeout(
            optimizeImage(selectedImage.file, position),
            IMAGE_STEP_TIMEOUT_MS,
            `La optimizacion de la imagen ${index + 1} tardo demasiado.`,
          );
          const imagePath = `products/${productId}/image-${position}-${Date.now()}-${crypto.randomUUID()}.webp`;

          setUploadMessage(
            `Subiendo imagen ${index + 1}/${selectedImages.length}...`,
          );

          const { error: uploadError } = await withTimeout(
            supabase.storage
              .from("product-images")
              .upload(imagePath, optimizedImage, {
                contentType: "image/webp",
                upsert: false,
              }),
            IMAGE_STEP_TIMEOUT_MS,
            `La subida de la imagen ${index + 1} tardo demasiado.`,
          );

          if (uploadError) {
            throw new Error(
              `No se pudo subir la imagen ${index + 1}: ${uploadError.message}`,
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

        const actionResult = await appendProductImages(
          productId,
          uploadedImages,
        );

        if (!actionResult.success) {
          throw new Error(actionResult.message);
        }

        selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setSelectedImages([]);
        setUploadMessage("");
        setResult({
          description: actionResult.message,
          shouldRefresh: true,
          title: "Imagenes subidas",
          variant: "success",
        });
      } catch (error) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("product-images").remove(uploadedPaths);
        }

        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron subir las imagenes.";

        setResult({
          description: message,
          shouldRefresh: false,
          title: "No se pudieron subir las imagenes",
          variant: "error",
        });
        setUploadMessage("");
      }
    });
  }

  function handleConfirmAction() {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.type === "delete") {
      executeDeleteImage(confirmAction.imageId);
      return;
    }

    if (confirmAction.type === "save-order") {
      executeSaveImageOrder();
      return;
    }

    executeUploadImages();
  }

  function handleCloseResult() {
    const shouldRefresh = result?.shouldRefresh === true;

    setResult(null);

    if (shouldRefresh) {
      router.refresh();
    }
  }

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  return (
    <>
      <ProductImageManager
        errorMessage={errorMessage}
        fileInputRef={fileInputRef}
        images={images}
        isDeleting={isDeletePending}
        isDragging={isDragging}
        isEditingImages={isEditingImages}
        isSavingOrder={isSaveOrderPending}
        isUploading={isUploadPending}
        onCancelEditImages={handleCancelEditImages}
        onDeleteImage={handleDeleteImage}
        onDragChange={setIsDragging}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
        onRemoveSelectedImage={handleRemoveSelectedImage}
        onSaveImageOrder={handleSaveImageOrder}
        onSortImages={handleSortImages}
        onStartEditImages={handleStartEditImages}
        onUploadImages={handleUploadImages}
        orderedImages={orderedImages}
        selectedImages={selectedImages}
      />
      <ConfirmDialog
        confirmLabel={getImageConfirmLabel(confirmAction)}
        description={getImageConfirmDescription(confirmAction)}
        isOpen={confirmAction !== null}
        isPending={isDeletePending || isSaveOrderPending || isUploadPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={getImageConfirmTitle(confirmAction)}
        variant={confirmAction?.type === "delete" ? "danger" : "default"}
      />
      <LoadingOverlay
        isVisible={isDeletePending || isSaveOrderPending || isUploadPending}
        message={getImageLoadingMessage({
          isDeletePending,
          isSaveOrderPending,
          isUploadPending,
          uploadMessage,
        })}
      />
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

function getImageConfirmTitle(action: ImageConfirmAction | null) {
  if (action?.type === "delete") {
    return "Eliminar imagen";
  }

  if (action?.type === "save-order") {
    return "Guardar orden de imagenes";
  }

  return "Subir imagenes";
}

function getImageConfirmDescription(action: ImageConfirmAction | null) {
  if (action?.type === "delete") {
    return "Se eliminara esta imagen del producto. Esta accion no se puede deshacer.";
  }

  if (action?.type === "save-order") {
    return "Se guardara el nuevo orden de las imagenes del producto.";
  }

  return "Se optimizaran y subiran las nuevas imagenes seleccionadas.";
}

function getImageConfirmLabel(action: ImageConfirmAction | null) {
  if (action?.type === "delete") {
    return "Eliminar imagen";
  }

  if (action?.type === "save-order") {
    return "Guardar orden";
  }

  return "Subir imagenes";
}

function getImageLoadingMessage({
  isDeletePending,
  isSaveOrderPending,
  isUploadPending,
  uploadMessage,
}: {
  isDeletePending: boolean;
  isSaveOrderPending: boolean;
  isUploadPending: boolean;
  uploadMessage: string;
}) {
  if (isDeletePending) {
    return "Eliminando imagen...";
  }

  if (isSaveOrderPending) {
    return "Guardando orden...";
  }

  if (isUploadPending) {
    return uploadMessage || "Subiendo imagenes...";
  }

  return "Procesando...";
}
