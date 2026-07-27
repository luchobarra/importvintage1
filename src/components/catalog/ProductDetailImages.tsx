import type { ProductImage } from "@/features/products/types";
import Image from "next/image";
import { ViewTransition } from "react";

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
              onClick={() => onSelectImage(index)}
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
        <div className="product-detail__main-image">
          {mainImage ? (
            <Image
              alt={title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
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
        </div>
      </ViewTransition>
    </section>
  );
}
