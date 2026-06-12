"use client";

import { SortableProductImage } from "@/components/products/SortableProductImage";
import type { ProductImage } from "@/features/products/types";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import Image from "next/image";

type CurrentProductImagesProps = {
  images: ProductImage[];
  isDeleting: boolean;
  isEditing: boolean;
  isSavingOrder: boolean;
  onCancelEdit: () => void;
  onDeleteImage: (imageId: string) => void;
  onSaveOrder: () => void;
  onSortImages: (activeImageId: string, overImageId: string) => void;
  onStartEdit: () => void;
};

export function CurrentProductImages({
  images,
  isDeleting,
  isEditing,
  isSavingOrder,
  onCancelEdit,
  onDeleteImage,
  onSaveOrder,
  onSortImages,
  onStartEdit,
}: CurrentProductImagesProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    onSortImages(String(active.id), String(over.id));
  }

  return (
    <section className="product-image-manager__section">
      <div className="product-image-manager__section-header">
        <h3>Imagenes actuales</h3>
        {isEditing ? (
          <div className="product-image-manager__section-actions">
            <button
              className="button button--primary"
              disabled={isSavingOrder || isDeleting}
              onClick={onSaveOrder}
              type="button"
            >
              Guardar orden
            </button>
            <button
              className="button"
              disabled={isSavingOrder || isDeleting}
              onClick={onCancelEdit}
              type="button"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button className="button" onClick={onStartEdit} type="button">
            Editar imagenes
          </button>
        )}
      </div>

      {isEditing ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={images.map((image) => image.id)}
            strategy={rectSortingStrategy}
          >
            <div className="product-image-manager__grid">
              {images.map((image, index) => (
                <SortableProductImage
                  image={image}
                  index={index}
                  isDeleting={isDeleting}
                  isSavingOrder={isSavingOrder}
                  key={image.id}
                  onDeleteImage={onDeleteImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="product-image-manager__grid">
          {images.map((image, index) => {
            const positionLabel =
              index === 0 ? "Principal" : `Posicion ${index + 1}`;

            return (
              <article className="product-image-manager__item" key={image.id}>
                <div className="product-image-manager__image">
                  <Image
                    src={image.image_url}
                    alt={`Imagen ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 180px"
                  />
                </div>

                <div className="product-image-manager__meta">
                  <span>{positionLabel}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
