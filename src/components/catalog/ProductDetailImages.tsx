import type { ProductImage } from "@/features/products/types";
import Image from "next/image";

type ProductDetailImagesProps = {
  images: ProductImage[];
  title: string;
};

export function ProductDetailImages({ images, title }: ProductDetailImagesProps) {
  const mainImage = images[0];

  return (
    <div className="product-detail__images">
      <div className="product-detail__main-image">
        {mainImage ? (
          <Image
            alt={title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 52vw"
            src={mainImage.image_url}
          />
        ) : (
          <span>Sin foto</span>
        )}
      </div>

      {images.length > 1 ? (
        <div aria-label="Fotos del producto" className="product-detail__thumbs">
          {images.map((image, index) => (
            <div className="product-detail__thumb" key={image.id}>
              <Image
                alt={`${title} - foto ${index + 1}`}
                fill
                sizes="96px"
                src={image.image_url}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
