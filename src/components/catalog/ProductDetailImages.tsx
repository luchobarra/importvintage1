import type { ProductImage } from "@/features/products/types";
import Image from "next/image";

type ProductDetailImagesProps = {
  images: ProductImage[];
  selectedImageIndex: number;
  title: string;
  onSelectImage: (index: number) => void;
};

export function ProductDetailImages({
  images,
  selectedImageIndex,
  title,
  onSelectImage,
}: ProductDetailImagesProps) {
  const mainImage = images[selectedImageIndex] ?? images[0];

  return (
    <section className="product-detail__gallery" aria-label={`Fotos de ${title}`}>
      {images.length > 1 ? (
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
        {images.length > 1 ? (
          <span className="product-detail__image-count">
            Foto {selectedImageIndex + 1} / {images.length}
          </span>
        ) : null}
      </div>
    </section>
  );
}
