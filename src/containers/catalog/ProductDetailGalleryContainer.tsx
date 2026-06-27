"use client";

import { ProductDetailImages } from "@/components/catalog/ProductDetailImages";
import type { ProductImage } from "@/features/products/types";
import { useState } from "react";

type ProductDetailGalleryContainerProps = {
  images: ProductImage[];
  title: string;
};

export function ProductDetailGalleryContainer({
  images,
  title,
}: ProductDetailGalleryContainerProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <ProductDetailImages
      images={images}
      selectedImageIndex={selectedImageIndex}
      title={title}
      onSelectImage={setSelectedImageIndex}
    />
  );
}
