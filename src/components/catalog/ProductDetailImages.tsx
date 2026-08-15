"use client";

import type { ProductImage } from "@/features/products/types";
import Image from "next/image";
import type { CSSProperties, PointerEvent } from "react";
import { ViewTransition } from "react";
import { useState } from "react";

type ProductDetailImagesProps = {
  images: ProductImage[];
  productId: string;
  selectedImageIndex: number;
  title: string;
  onSelectImage: (index: number) => void;
};

export function ProductDetailImages({
  images,
  productId,
  selectedImageIndex,
  title,
  onSelectImage,
}: ProductDetailImagesProps) {
  const mainImage = images[selectedImageIndex] ?? images[0];
  const hasThumbs = images.length > 1;
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  function resetZoom() {
    setIsZoomActive(false);
    setZoomPosition({ x: 50, y: 50 });
  }

  function handleSelectImage(index: number) {
    resetZoom();
    onSelectImage(index);
  }

  function updateZoomPosition(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    });
  }

  function handlePointerEnter(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse") {
      updateZoomPosition(event);
      setIsZoomActive(true);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!isZoomActive && event.pointerType !== "mouse") {
      return;
    }

    updateZoomPosition(event);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    updateZoomPosition(event);

    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsZoomActive((currentValue) => !currentValue);
      return;
    }

    setIsZoomActive(true);
  }

  function handlePointerLeave() {
    setIsZoomActive(false);
  }

  return (
    <section
      className={`product-detail__gallery${hasThumbs ? " product-detail__gallery--with-thumbs" : ""}`}
      aria-label={`Fotos de ${title}`}
    >
      {hasThumbs ? (
        <div aria-label="Seleccionar foto del producto" className="product-detail__thumbs">
          {images.map((image, index) => (
            <button
              aria-label={`Ver foto ${index + 1} de ${images.length}`}
              aria-pressed={index === selectedImageIndex}
              className="product-detail__thumb"
              key={image.id}
              onClick={() => handleSelectImage(index)}
              type="button"
            >
              <Image
                alt={`${title} - foto ${index + 1}`}
                fill
                sizes="(max-width: 640px) 72px, 88px"
                src={image.image_url}
              />
            </button>
          ))}
        </div>
      ) : null}

      <ViewTransition name={`product-image-${productId}`}>
        <button
          aria-label={
            isZoomActive
              ? `Quitar zoom de ${title}`
              : `Hacer zoom sobre ${title}`
          }
          aria-pressed={isZoomActive}
          className={`product-detail__main-image${
            mainImage ? " product-detail__main-image--zoomable" : ""
          }${isZoomActive ? " product-detail__main-image--zoom-active" : ""}`}
          disabled={!mainImage}
          onPointerDown={handlePointerDown}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          style={
            {
              "--zoom-x": `${zoomPosition.x}%`,
              "--zoom-y": `${zoomPosition.y}%`,
            } as CSSProperties
          }
          type="button"
        >
          {mainImage ? (
            <Image
              alt={title}
              draggable={false}
              fill
              priority
              quality={95}
              sizes="(max-width: 900px) 100vw, 760px"
              src={mainImage.image_url}
            />
          ) : (
            <span className="product-detail__empty-image">Sin foto</span>
          )}
          {hasThumbs ? (
            <span className="product-detail__image-count">
              Foto {selectedImageIndex + 1} / {images.length}
            </span>
          ) : null}
        </button>
      </ViewTransition>
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
