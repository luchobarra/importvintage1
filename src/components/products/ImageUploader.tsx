import type { SelectedImage } from "@/features/images/types";
import type { ChangeEvent, DragEvent, RefObject } from "react";

type ImageUploaderProps = {
  actionLabel?: string;
  ariaLabel?: string;
  countLabel?: string;
  description?: string;
  disabled: boolean;
  dropzoneText?: string;
  feedbackMessage?: string;
  feedbackVariant?: "error" | "info";
  fileInputRef: RefObject<HTMLInputElement | null>;
  images: SelectedImage[];
  isAddDisabled?: boolean;
  isDragging: boolean;
  onDragChange: (isDragging: boolean) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (imageId: string) => void;
  title?: string;
};

export function ImageUploader({
  actionLabel = "Buscar imagenes",
  ariaLabel = "Imagenes del producto",
  countLabel,
  description = "Minimo 1, maximo 5. La primera foto sera la principal.",
  disabled,
  dropzoneText = "Arrastra imagenes aca o buscalas en tu computadora.",
  feedbackMessage,
  feedbackVariant = "info",
  fileInputRef,
  images,
  isAddDisabled = false,
  isDragging,
  onDragChange,
  onDrop,
  onFileChange,
  onRemoveImage,
  title = "Fotos *",
}: ImageUploaderProps) {
  const isDropzoneDisabled = disabled || isAddDisabled;

  return (
    <section className="image-uploader" aria-label={ariaLabel}>
      <div className="image-uploader__header">
        <div>
          <span>{title}</span>
          <p>{description}</p>
        </div>
        <strong>{countLabel ?? `${images.length}/5`}</strong>
      </div>

      <div
        className={getDropzoneClassName({
          disabled: isDropzoneDisabled,
          isDragging,
        })}
        onDragEnter={(event) => {
          event.preventDefault();
          if (isDropzoneDisabled) {
            return;
          }
          onDragChange(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          onDragChange(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (isDropzoneDisabled) {
            onDragChange(false);
            return;
          }
          onDrop(event);
        }}
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          hidden
          multiple
          onChange={onFileChange}
          ref={fileInputRef}
          type="file"
        />
        <p>{dropzoneText}</p>
        <button
          className="button"
          disabled={isDropzoneDisabled}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {actionLabel}
        </button>
      </div>

      {feedbackMessage ? (
        <p
          className={`image-uploader__feedback image-uploader__feedback--${feedbackVariant}`}
          role={feedbackVariant === "error" ? "alert" : "status"}
        >
          {feedbackMessage}
        </p>
      ) : null}

      {images.length > 0 ? (
        <div className="image-preview-grid">
          {images.map((image, index) => (
            <article className="image-preview" key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={`Vista previa ${index + 1}`} src={image.previewUrl} />
              <div className="image-preview__meta">
                <span>{index + 1}</span>
                <button
                  className="image-preview__remove"
                  disabled={disabled}
                  onClick={() => onRemoveImage(image.id)}
                  type="button"
                >
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function getDropzoneClassName({
  disabled,
  isDragging,
}: {
  disabled: boolean;
  isDragging: boolean;
}) {
  return [
    "image-dropzone",
    isDragging ? "image-dropzone--active" : "",
    disabled ? "image-dropzone--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
