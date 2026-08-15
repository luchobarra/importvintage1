"use client";

import type { ProductImage } from "@/features/products/types";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import type {
  CSSProperties,
  PointerEvent,
  TouchEvent,
} from "react";
import { ViewTransition } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(selectedImageIndex);
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerOffset, setViewerOffset] = useState({ x: 0, y: 0 });
  const touchStateRef = useRef<{
    distance: number;
    offset: { x: number; y: number };
    scale: number;
    startX: number;
    startY: number;
  } | null>(null);

  const viewerImage = images[viewerIndex] ?? mainImage;

  function resetZoom() {
    setIsZoomActive(false);
    setZoomPosition({ x: 50, y: 50 });
  }

  function handleSelectImage(index: number) {
    resetZoom();
    onSelectImage(index);
  }

  const resetViewerZoom = useCallback(() => {
    setViewerScale(1);
    setViewerOffset({ x: 0, y: 0 });
    touchStateRef.current = null;
  }, []);

  function openViewer(index = selectedImageIndex) {
    if (!images[index]) {
      return;
    }

    setViewerIndex(index);
    resetViewerZoom();
    setIsViewerOpen(true);
  }

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    resetViewerZoom();
  }, [resetViewerZoom]);

  const selectViewerImage = useCallback((index: number) => {
    if (images.length === 0) {
      return;
    }

    setViewerIndex((index + images.length) % images.length);
    resetViewerZoom();
  }, [images.length, resetViewerZoom]);

  const selectRelativeViewerImage = useCallback((direction: "back" | "forward") => {
    selectViewerImage(viewerIndex + (direction === "forward" ? 1 : -1));
  }, [selectViewerImage, viewerIndex]);

  useEffect(() => {
    if (!isViewerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        selectRelativeViewerImage("back");
      }

      if (event.key === "ArrowRight") {
        selectRelativeViewerImage("forward");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeViewer, isViewerOpen, selectRelativeViewerImage]);

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
    if (!isZoomActive) {
      return;
    }

    updateZoomPosition(event);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    updateZoomPosition(event);

    if (event.pointerType !== "mouse") {
      openViewer(selectedImageIndex);
      return;
    }

    setIsZoomActive(true);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }
  }

  function handlePointerCancel() {
    setIsZoomActive(false);
  }

  function handlePointerLeave(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }

    setIsZoomActive(false);
  }

  function handleViewerTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 1) {
      touchStateRef.current = {
        distance: 0,
        offset: viewerOffset,
        scale: viewerScale,
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
      };
      return;
    }

    if (event.touches.length === 2) {
      event.preventDefault();
      touchStateRef.current = {
        distance: getTouchDistance(event),
        offset: viewerOffset,
        scale: viewerScale,
        startX: getTouchCenter(event).x,
        startY: getTouchCenter(event).y,
      };
    }
  }

  function handleViewerTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touchState = touchStateRef.current;

    if (!touchState) {
      return;
    }

    if (event.touches.length === 2 && touchState.distance > 0) {
      event.preventDefault();
      const nextScale = clamp(
        touchState.scale * (getTouchDistance(event) / touchState.distance),
        1,
        3,
      );

      setViewerScale(nextScale);
      return;
    }

    if (event.touches.length === 1 && viewerScale > 1) {
      event.preventDefault();
      const touch = event.touches[0];

      setViewerOffset({
        x: touchState.offset.x + touch.clientX - touchState.startX,
        y: touchState.offset.y + touch.clientY - touchState.startY,
      });
    }
  }

  function handleViewerTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchState = touchStateRef.current;

    if (!touchState || event.touches.length > 0) {
      return;
    }

    const changedTouch = event.changedTouches[0];
    const deltaX = changedTouch.clientX - touchState.startX;
    const deltaY = changedTouch.clientY - touchState.startY;

    if (viewerScale <= 1.02 && Math.abs(deltaX) > 58 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      selectRelativeViewerImage(deltaX < 0 ? "forward" : "back");
    }

    if (viewerScale <= 1.02) {
      resetViewerZoom();
    }

    touchStateRef.current = null;
  }

  const viewer =
    isViewerOpen && viewerImage ? (
      <div className="product-image-viewer" role="dialog" aria-modal="true">
        <button
          aria-label="Cerrar visor"
          className="product-image-viewer__close"
          onClick={closeViewer}
          type="button"
        >
          <X size={20} strokeWidth={1.8} />
        </button>

        {images.length > 1 ? (
          <button
            aria-label="Ver foto anterior"
            className="product-image-viewer__nav product-image-viewer__nav--prev"
            onClick={() => selectRelativeViewerImage("back")}
            type="button"
          >
            <ChevronLeft size={22} strokeWidth={1.8} />
          </button>
        ) : null}

        <div
          className="product-image-viewer__surface"
          onTouchEnd={handleViewerTouchEnd}
          onTouchMove={handleViewerTouchMove}
          onTouchStart={handleViewerTouchStart}
        >
          <div
            className="product-image-viewer__image"
            style={
              {
                "--viewer-offset-x": `${viewerOffset.x}px`,
                "--viewer-offset-y": `${viewerOffset.y}px`,
                "--viewer-scale": viewerScale,
              } as CSSProperties
            }
          >
            <Image
              alt={title}
              draggable={false}
              fill
              quality={95}
              sizes="100vw"
              src={viewerImage.image_url}
            />
          </div>
        </div>

        {images.length > 1 ? (
          <button
            aria-label="Ver foto siguiente"
            className="product-image-viewer__nav product-image-viewer__nav--next"
            onClick={() => selectRelativeViewerImage("forward")}
            type="button"
          >
            <ChevronRight size={22} strokeWidth={1.8} />
          </button>
        ) : null}

        {images.length > 1 ? (
          <span className="product-image-viewer__count">
            {viewerIndex + 1} / {images.length}
          </span>
        ) : null}
      </div>
    ) : null;

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
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
      {viewer ? createPortal(viewer, document.body) : null}
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTouchDistance(event: TouchEvent<HTMLDivElement>) {
  const firstTouch = event.touches[0];
  const secondTouch = event.touches[1];
  const deltaX = firstTouch.clientX - secondTouch.clientX;
  const deltaY = firstTouch.clientY - secondTouch.clientY;

  return Math.hypot(deltaX, deltaY);
}

function getTouchCenter(event: TouchEvent<HTMLDivElement>) {
  const firstTouch = event.touches[0];
  const secondTouch = event.touches[1];

  return {
    x: (firstTouch.clientX + secondTouch.clientX) / 2,
    y: (firstTouch.clientY + secondTouch.clientY) / 2,
  };
}
