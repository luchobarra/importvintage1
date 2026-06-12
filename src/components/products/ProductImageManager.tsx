import { CurrentProductImages } from "@/components/products/CurrentProductImages";
import { NewProductImagesUploader } from "@/components/products/NewProductImagesUploader";
import type { SelectedImage } from "@/features/images/types";
import type { ProductImage } from "@/features/products/types";
import type { ChangeEvent, DragEvent, RefObject } from "react";

type ProductImageManagerProps = {
  errorMessage: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  images: ProductImage[];
  isDeleting: boolean;
  isDragging: boolean;
  isEditingImages: boolean;
  isSavingOrder: boolean;
  isUploading: boolean;
  orderedImages: ProductImage[];
  selectedImages: SelectedImage[];
  onCancelEditImages: () => void;
  onDeleteImage: (imageId: string) => void;
  onDragChange: (isDragging: boolean) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveSelectedImage: (imageId: string) => void;
  onSaveImageOrder: () => void;
  onSortImages: (activeImageId: string, overImageId: string) => void;
  onStartEditImages: () => void;
  onUploadImages: () => void;
};

export function ProductImageManager({
  errorMessage,
  fileInputRef,
  images,
  isDeleting,
  isDragging,
  isEditingImages,
  isSavingOrder,
  isUploading,
  orderedImages,
  selectedImages,
  onCancelEditImages,
  onDeleteImage,
  onDragChange,
  onDrop,
  onFileChange,
  onRemoveSelectedImage,
  onSaveImageOrder,
  onSortImages,
  onStartEditImages,
  onUploadImages,
}: ProductImageManagerProps) {
  const hasReachedImageLimit = images.length + selectedImages.length >= 5;
  const visibleImages = isEditingImages ? orderedImages : images;
  const isBusy = isDeleting || isSavingOrder || isUploading;

  return (
    <div className="product-image-manager">
      <div className="product-image-manager__header">
        <div>
          <h2>Imagenes del producto</h2>
          <p>La primera imagen es la foto principal.</p>
        </div>
        <strong>{images.length}/5</strong>
      </div>

      <CurrentProductImages
        images={visibleImages}
        isDeleting={isDeleting}
        isEditing={isEditingImages}
        isSavingOrder={isSavingOrder}
        onCancelEdit={onCancelEditImages}
        onDeleteImage={onDeleteImage}
        onSaveOrder={onSaveImageOrder}
        onSortImages={onSortImages}
        onStartEdit={onStartEditImages}
      />

      <NewProductImagesUploader
        currentImageCount={images.length}
        fileInputRef={fileInputRef}
        hasReachedImageLimit={hasReachedImageLimit}
        isBusy={isBusy}
        isDragging={isDragging}
        onDragChange={onDragChange}
        onDrop={onDrop}
        onFileChange={onFileChange}
        onRemoveSelectedImage={onRemoveSelectedImage}
        onUploadImages={onUploadImages}
        selectedImages={selectedImages}
      />

      {errorMessage ? (
        <p className="auth-form__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
