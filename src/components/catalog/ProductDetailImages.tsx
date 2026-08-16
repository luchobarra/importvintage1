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

type ViewerPoint = {
  x: number;
  y: number;
};

type ViewerTransform = {
  offset: ViewerPoint;
  scale: number;
};

const VIEWER_DOUBLE_TAP_SCALE = 2.15;
const VIEWER_MAX_SCALE = 2.8;
const VIEWER_PINCH_SENSITIVITY = 0.86;
const MAIN_IMAGE_TAP_MAX_DURATION_MS = 420;
const MAIN_IMAGE_TAP_MOVE_TOLERANCE_PX = 10;

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
  const [isViewerInteracting, setIsViewerInteracting] = useState(false);
  const viewerImageRef = useRef<HTMLDivElement>(null);
  const viewerTransformRef = useRef<ViewerTransform>({
    offset: { x: 0, y: 0 },
    scale: 1,
  });
  const viewerAnimationFrameRef = useRef<number | null>(null);
  const mainImageTapRef = useRef<{
    hasMoved: boolean;
    pointerId: number;
    startTime: number;
    startX: number;
    startY: number;
  } | null>(null);
  const lastViewerTapRef = useRef<{
    time: number;
    x: number;
    y: number;
  } | null>(null);
  const touchStateRef = useRef<{
    distance: number;
    focal: ViewerPoint;
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
    viewerTransformRef.current = {
      offset: { x: 0, y: 0 },
      scale: 1,
    };
    writeViewerTransform(viewerImageRef.current, viewerTransformRef.current);
    setViewerScale(1);
    setViewerOffset({ x: 0, y: 0 });
    setIsViewerInteracting(false);
    lastViewerTapRef.current = null;
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

  const applyViewerTransform = useCallback((scale: number, offset: ViewerPoint) => {
    const nextScale = clamp(scale, 1, VIEWER_MAX_SCALE);
    const nextOffset = nextScale <= 1.01
      ? { x: 0, y: 0 }
      : clampViewerOffset(offset, nextScale, viewerImageRef.current);
    const nextTransform = {
      offset: nextOffset,
      scale: nextScale,
    };

    viewerTransformRef.current = nextTransform;
    setViewerScale(nextScale);
    setViewerOffset(nextOffset);
  }, []);

  const previewViewerTransform = useCallback((scale: number, offset: ViewerPoint) => {
    const nextScale = clamp(scale, 1, VIEWER_MAX_SCALE);
    const nextOffset = nextScale <= 1.01
      ? { x: 0, y: 0 }
      : clampViewerOffset(offset, nextScale, viewerImageRef.current);

    viewerTransformRef.current = {
      offset: nextOffset,
      scale: nextScale,
    };

    if (viewerAnimationFrameRef.current !== null) {
      return;
    }

    viewerAnimationFrameRef.current = window.requestAnimationFrame(() => {
      viewerAnimationFrameRef.current = null;
      writeViewerTransform(viewerImageRef.current, viewerTransformRef.current);
    });
  }, []);

  const commitViewerTransform = useCallback(() => {
    const { offset, scale } = viewerTransformRef.current;

    if (viewerAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(viewerAnimationFrameRef.current);
      viewerAnimationFrameRef.current = null;
    }

    writeViewerTransform(viewerImageRef.current, viewerTransformRef.current);
    setViewerScale(scale);
    setViewerOffset(offset);
  }, []);

  const toggleViewerZoom = useCallback((point: ViewerPoint) => {
    if (viewerScale > 1.08) {
      applyViewerTransform(1, { x: 0, y: 0 });
      return;
    }

    const framePoint = getPointFromElementCenter(viewerImageRef.current, point);
    const nextScale = VIEWER_DOUBLE_TAP_SCALE;
    const nextOffset = {
      x: -framePoint.x * (nextScale - 1),
      y: -framePoint.y * (nextScale - 1),
    };

    applyViewerTransform(nextScale, nextOffset);
  }, [applyViewerTransform, viewerScale]);

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
      if (viewerAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(viewerAnimationFrameRef.current);
        viewerAnimationFrameRef.current = null;
      }

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
    if (event.pointerType !== "mouse") {
      const tapState = mainImageTapRef.current;

      if (!tapState || tapState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - tapState.startX;
      const deltaY = event.clientY - tapState.startY;

      if (Math.hypot(deltaX, deltaY) > MAIN_IMAGE_TAP_MOVE_TOLERANCE_PX) {
        tapState.hasMoved = true;
      }

      return;
    }

    if (!isZoomActive) {
      return;
    }

    updateZoomPosition(event);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") {
      mainImageTapRef.current = {
        hasMoved: false,
        pointerId: event.pointerId,
        startTime: window.performance.now(),
        startX: event.clientX,
        startY: event.clientY,
      };
      return;
    }

    updateZoomPosition(event);
    setIsZoomActive(true);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") {
      const tapState = mainImageTapRef.current;
      mainImageTapRef.current = null;

      if (!tapState || tapState.pointerId !== event.pointerId) {
        return;
      }

      const elapsedTime = window.performance.now() - tapState.startTime;
      const deltaX = event.clientX - tapState.startX;
      const deltaY = event.clientY - tapState.startY;
      const hasMoved =
        tapState.hasMoved ||
        Math.hypot(deltaX, deltaY) > MAIN_IMAGE_TAP_MOVE_TOLERANCE_PX;

      if (!hasMoved && elapsedTime <= MAIN_IMAGE_TAP_MAX_DURATION_MS) {
        openViewer(selectedImageIndex);
      }

      return;
    }
  }

  function handlePointerCancel() {
    mainImageTapRef.current = null;
    setIsZoomActive(false);
  }

  function handlePointerLeave(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") {
      mainImageTapRef.current = null;
      return;
    }

    setIsZoomActive(false);
  }

  function handleViewerTouchStart(event: TouchEvent<HTMLDivElement>) {
    setIsViewerInteracting(true);
    const currentTransform = viewerTransformRef.current;

    if (event.touches.length === 1) {
      const touch = event.touches[0];

      touchStateRef.current = {
        distance: 0,
        focal: getPointFromElementCenter(viewerImageRef.current, {
          x: touch.clientX,
          y: touch.clientY,
        }),
        offset: currentTransform.offset,
        scale: currentTransform.scale,
        startX: touch.clientX,
        startY: touch.clientY,
      };
      return;
    }

    if (event.touches.length === 2) {
      const center = getTouchCenter(event);

      touchStateRef.current = {
        distance: getTouchDistance(event),
        focal: getPointFromElementCenter(viewerImageRef.current, center),
        offset: currentTransform.offset,
        scale: currentTransform.scale,
        startX: center.x,
        startY: center.y,
      };
    }
  }

  function handleViewerTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touchState = touchStateRef.current;

    if (!touchState) {
      return;
    }

    if (event.touches.length === 2 && touchState.distance > 0) {
      const center = getTouchCenter(event);
      const distanceRatio = getTouchDistance(event) / touchState.distance;
      const nextScale = clamp(
        touchState.scale * Math.pow(distanceRatio, VIEWER_PINCH_SENSITIVITY),
        1,
        VIEWER_MAX_SCALE,
      );
      const ratio = nextScale / touchState.scale;
      const currentFocal = getPointFromElementCenter(viewerImageRef.current, center);
      const nextOffset = {
        x: currentFocal.x - (touchState.focal.x - touchState.offset.x) * ratio,
        y: currentFocal.y - (touchState.focal.y - touchState.offset.y) * ratio,
      };

      previewViewerTransform(nextScale, nextOffset);
      return;
    }

    if (event.touches.length === 1 && viewerTransformRef.current.scale > 1) {
      const touch = event.touches[0];

      previewViewerTransform(viewerTransformRef.current.scale, {
        x: touchState.offset.x + touch.clientX - touchState.startX,
        y: touchState.offset.y + touch.clientY - touchState.startY,
      });
    }
  }

  function handleViewerTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchState = touchStateRef.current;

    if (!touchState) {
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const currentTransform = viewerTransformRef.current;

      touchStateRef.current = {
        distance: 0,
        focal: getPointFromElementCenter(viewerImageRef.current, {
          x: touch.clientX,
          y: touch.clientY,
        }),
        offset: currentTransform.offset,
        scale: currentTransform.scale,
        startX: touch.clientX,
        startY: touch.clientY,
      };
      return;
    }

    const changedTouch = event.changedTouches[0];
    const deltaX = changedTouch.clientX - touchState.startX;
    const deltaY = changedTouch.clientY - touchState.startY;
    const movedDistance = Math.hypot(deltaX, deltaY);
    const now = window.performance.now();
    const previousTap = lastViewerTapRef.current;
    const isTap = movedDistance < 12 && touchState.distance === 0;
    const isDoubleTap = Boolean(
      isTap &&
      previousTap &&
      now - previousTap.time < 320 &&
      Math.hypot(changedTouch.clientX - previousTap.x, changedTouch.clientY - previousTap.y) < 34,
    );

    if (isDoubleTap) {
      setIsViewerInteracting(false);
      toggleViewerZoom({ x: changedTouch.clientX, y: changedTouch.clientY });
      lastViewerTapRef.current = null;
      touchStateRef.current = null;
      return;
    }

    if (isTap) {
      lastViewerTapRef.current = {
        time: now,
        x: changedTouch.clientX,
        y: changedTouch.clientY,
      };
    }

    const currentViewerScale = viewerTransformRef.current.scale;

    if (currentViewerScale <= 1.02 && Math.abs(deltaX) > 58 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      setIsViewerInteracting(false);
      selectRelativeViewerImage(deltaX < 0 ? "forward" : "back");
      touchStateRef.current = null;
      return;
    }

    commitViewerTransform();

    if (currentViewerScale <= 1.02 && !isTap) {
      resetViewerZoom();
    }

    touchStateRef.current = null;
    setIsViewerInteracting(false);
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
            className={`product-image-viewer__image${
              isViewerInteracting ? " product-image-viewer__image--interacting" : ""
            }`}
            ref={viewerImageRef}
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

function getPointFromElementCenter(element: HTMLElement | null, point: ViewerPoint) {
  if (!element) {
    return { x: 0, y: 0 };
  }

  const center = getElementBaseCenter(element);

  return {
    x: point.x - center.x,
    y: point.y - center.y,
  };
}

function clampViewerOffset(offset: ViewerPoint, scale: number, element: HTMLElement | null) {
  if (!element || scale <= 1) {
    return { x: 0, y: 0 };
  }

  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const maxX = Math.max(0, (width * scale - width) / 2);
  const maxY = Math.max(0, (height * scale - height) / 2);

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

function getElementBaseCenter(element: HTMLElement) {
  const surface = element.parentElement;
  const rect = surface?.getBoundingClientRect() ?? element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function writeViewerTransform(element: HTMLElement | null, transform: ViewerTransform) {
  if (!element) {
    return;
  }

  element.style.setProperty("--viewer-offset-x", `${transform.offset.x}px`);
  element.style.setProperty("--viewer-offset-y", `${transform.offset.y}px`);
  element.style.setProperty("--viewer-scale", String(transform.scale));
}
