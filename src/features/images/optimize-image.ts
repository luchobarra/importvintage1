const MAX_IMAGE_WIDTH = 1200;
const WEBP_QUALITY = 0.82;

export async function optimizeImage(file: File, position: number) {
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

