"use client";

import {
  createProductDraft,
  deleteProductDraft,
  saveProductImages,
  type ProductFormState,
} from "@/app/admin/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

const initialState: ProductFormState = {
  message: "",
  success: false,
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1200;
const WEBP_QUALITY = 0.82;
const IMAGE_STEP_TIMEOUT_MS = 45000;

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type ProgressState = {
  label: string;
  detail: string;
  current: number;
  total: number;
};

export function ProductForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedImage[]>([]);
  const [state, setState] = useState<ProductFormState>(initialState);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);
    setIsComplete(false);

    if (images.length < 1) {
      setState({
        message: "Carga al menos 1 imagen.",
        success: false,
      });
      return;
    }

    const confirmed = window.confirm(
      "Confirmas que queres cargar este producto al catalogo?",
    );

    if (!confirmed) {
      return;
    }

    const form = event.currentTarget;

    startTransition(async () => {
      const formData = new FormData(form);
      let productId = "";
      const uploadedPaths: string[] = [];

      try {
        setIsModalOpen(true);
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
        setProgress(null);
        setState({
          message: "Producto cargado correctamente.",
          success: true,
        });
        setIsComplete(true);
        router.refresh();
      } catch (error) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("product-images").remove(uploadedPaths);
        }

        if (productId) {
          await deleteProductDraft(productId);
        }

        setProgress(null);
        setIsModalOpen(true);
        setState({
          message:
            error instanceof Error
              ? error.message
              : "No se pudo completar la carga del producto.",
          success: false,
        });
      }
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
    setState(initialState);
    setIsComplete(false);

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
      setState({
        message: "Solo se aceptan imagenes JPG, PNG o WebP.",
        success: false,
      });
    }

    if (oversizedFiles.length > 0) {
      setState({
        message: `Cada imagen debe pesar como maximo ${MAX_FILE_SIZE_MB} MB antes de optimizar.`,
        success: false,
      });
    }

    if (imageFiles.length === 0) {
      return;
    }

    setImages((currentImages) => {
      const availableSlots = MAX_IMAGES - currentImages.length;

      if (availableSlots <= 0) {
        setState({
          message: "El maximo permitido es de 5 imagenes.",
          success: false,
        });
        return currentImages;
      }

      const selectedFiles = imageFiles.slice(0, availableSlots);

      if (imageFiles.length > availableSlots) {
        setState({
          message: "Se agregaron solo las imagenes que entran en el maximo de 5.",
          success: false,
        });
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
    setIsComplete(false);

    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
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
    <form className="product-form" onSubmit={handleSubmit} ref={formRef}>
      <div className="product-form__grid">
        <label className="form-field" htmlFor="title">
          <span>Titulo *</span>
          <input id="title" name="title" required type="text" />
        </label>

        <label className="form-field" htmlFor="brand">
          <span>Marca *</span>
          <input id="brand" name="brand" required type="text" />
        </label>

        <label className="form-field" htmlFor="category">
          <span>Categoria *</span>
          <select id="category" name="category" required>
            <option value="">Seleccionar</option>
            <option value="pantalones">Pantalones</option>
            <option value="buzos">Buzos</option>
            <option value="polar">Polar</option>
          </select>
        </label>

        <label className="form-field" htmlFor="size">
          <span>Talle *</span>
          <input id="size" name="size" required type="text" />
        </label>

        <label className="form-field" htmlFor="price">
          <span>Precio en pesos *</span>
          <input
            id="price"
            min="1"
            name="price"
            required
            step="1"
            type="number"
          />
        </label>
      </div>

      <label className="form-field" htmlFor="description">
        <span>Descripcion / estado</span>
        <textarea id="description" name="description" rows={5} />
      </label>

      <section className="image-uploader" aria-label="Imagenes del producto">
        <div className="image-uploader__header">
          <div>
            <span>Fotos *</span>
            <p>Minimo 1, maximo 5. La primera foto sera la principal.</p>
          </div>
          <strong>{images.length}/5</strong>
        </div>

        <div
          className={`image-dropzone${isDragging ? " image-dropzone--active" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            accept="image/jpeg,image/png,image/webp"
            hidden
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <p>Arrastra imagenes aca o buscalas en tu computadora.</p>
          <button
            className="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Buscar imagenes
          </button>
        </div>

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
                    disabled={isPending}
                    onClick={() => removeImage(image.id)}
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

      {progress ? (
        <div aria-live="polite" className="upload-progress upload-progress--inline">
          <strong>{progress.label}</strong>
        </div>
      ) : null}

      {state.message && !isModalOpen ? (
        <p
          aria-live="polite"
          className={state.success ? "form-message" : "auth-form__error"}
        >
          {state.message}
        </p>
      ) : null}

      <div className="product-form__actions">
        {!isComplete ? (
          <button
            className="button button--primary"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Procesando carga..." : "Cargar producto"}
          </button>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="status-modal" role="dialog" aria-modal="true">
          <div className="status-modal__panel">
            {progress ? (
              <>
                <p className="status-modal__eyebrow">Cargando producto</p>
                <h2>{progress.label}</h2>
                <p>{progress.detail}</p>
                <div className="upload-progress">
                  <div className="upload-progress__header">
                    <strong>Progreso</strong>
                    <span>
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <progress max={progress.total} value={progress.current} />
                </div>
              </>
            ) : (
              <>
                <p className="status-modal__eyebrow">
                  {state.success ? "Carga completa" : "Error de carga"}
                </p>
                <h2>
                  {state.success
                    ? "Producto cargado correctamente"
                    : "No se pudo cargar el producto"}
                </h2>
                <p>{state.message}</p>
                <div className="status-modal__actions">
                  {state.success ? (
                    <>
                      <button
                        className="button"
                        onClick={() => {
                          setState(initialState);
                          setIsComplete(false);
                          setIsModalOpen(false);
                          formRef.current?.reset();
                        }}
                        type="button"
                      >
                        Cargar otro producto
                      </button>
                      <button
                        className="button button--primary"
                        onClick={() => router.push("/")}
                        type="button"
                      >
                        Ver catalogo
                      </button>
                    </>
                  ) : (
                    <button
                      className="button button--primary"
                      onClick={() => setIsModalOpen(false)}
                      type="button"
                    >
                      Volver al formulario
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}

async function optimizeImage(file: File, position: number) {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(image.src);
    throw new Error("No se pudo preparar la optimizacion de imagenes.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  URL.revokeObjectURL(image.src);

  if (!blob) {
    throw new Error("No se pudo convertir una imagen a WebP.");
  }

  return new File([blob], `image-${position}.webp`, {
    type: "image/webp",
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("No se pudo leer una de las imagenes."));
    };

    image.src = imageUrl;
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}
