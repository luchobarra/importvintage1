"use client";

import type { ProductImage } from "@/features/products/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

type SortableProductImageProps = {
  image: ProductImage;
  index: number;
  isDeleting: boolean;
  isSavingOrder: boolean;
  onDeleteImage: (imageId: string) => void;
};

export function SortableProductImage({
  image,
  index,
  isDeleting,
  isSavingOrder,
  onDeleteImage,
}: SortableProductImageProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: image.id,
    disabled: isSavingOrder || isDeleting,
  });
  const positionLabel = index === 0 ? "Principal" : `Posición ${index + 1}`;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={`product-image-manager__item product-image-manager__item--sortable${
        isDragging ? " product-image-manager__item--dragging" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="product-image-manager__card-top">
        <span className="product-image-manager__badge">{positionLabel}</span>
        <button
          aria-label={`Eliminar imagen ${index + 1}`}
          className="product-image-manager__delete-icon"
          disabled={isSavingOrder || isDeleting}
          onClick={() => onDeleteImage(image.id)}
          type="button"
        >
          🗑
        </button>
      </div>

      <div
        {...attributes}
        {...listeners}
        aria-label={`Mover imagen ${index + 1}`}
        className="product-image-manager__drag-area"
      >
        <div className="product-image-manager__image">
          <Image
            src={image.image_url}
            alt={`Imagen ${index + 1}`}
            fill
            sizes="(max-width: 640px) 50vw, 180px"
          />
        </div>
      </div>
    </article>
  );
}
