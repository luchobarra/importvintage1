import { ImageUploader } from "@/components/products/ImageUploader";
import type { SelectedImage } from "@/features/images/types";
import type { ChangeEvent, DragEvent, RefObject } from "react";

type NewProductImagesUploaderProps = {
  currentImageCount: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  hasReachedImageLimit: boolean;
  isBusy: boolean;
  isDragging: boolean;
  selectedImages: SelectedImage[];
  onDragChange: (isDragging: boolean) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveSelectedImage: (imageId: string) => void;
  onUploadImages: () => void;
};

export function NewProductImagesUploader({
  currentImageCount,
  fileInputRef,
  hasReachedImageLimit,
  isBusy,
  isDragging,
  selectedImages,
  onDragChange,
  onDrop,
  onFileChange,
  onRemoveSelectedImage,
  onUploadImages,
}: NewProductImagesUploaderProps) {
  return (
    <section className="product-image-manager__section">
      <div className="product-image-manager__section-header">
        <h3>Agregar imagenes</h3>
      </div>

      <ImageUploader
        actionLabel="Buscar imagenes"
        ariaLabel="Agregar imagenes al producto"
        countLabel={`${currentImageCount + selectedImages.length}/5`}
        description="Arrastra o selecciona nuevas fotos. Se agregan al final y se optimizan antes de subir."
        disabled={isBusy}
        dropzoneText="Arrastra nuevas imagenes aca o buscalas en tu computadora."
        feedbackMessage={
          hasReachedImageLimit
            ? "Este producto ya tiene las 5 imagenes permitidas."
            : ""
        }
        feedbackVariant="info"
        fileInputRef={fileInputRef}
        images={selectedImages}
        isAddDisabled={hasReachedImageLimit}
        isDragging={isDragging}
        onDragChange={onDragChange}
        onDrop={onDrop}
        onFileChange={onFileChange}
        onRemoveImage={onRemoveSelectedImage}
        title="Nuevas fotos"
      />

      <div className="product-image-manager__upload-actions">
        <button
          className="button button--primary"
          disabled={selectedImages.length === 0 || isBusy}
          onClick={onUploadImages}
          type="button"
        >
          Subir imagenes
        </button>
      </div>
    </section>
  );
}
