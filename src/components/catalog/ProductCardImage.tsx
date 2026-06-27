"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ProductCardImageProps = {
  alt: string;
  loading?: "eager" | "lazy";
  sizes: string;
  src: string;
};

export function ProductCardImage({
  alt,
  loading = "lazy",
  sizes,
  src,
}: ProductCardImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadedClassName = isLoaded ? " product-card__image-asset--loaded" : "";

  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <Image
      alt={alt}
      className={`product-card__image-asset${loadedClassName}`}
      fill
      loading={loading}
      onError={() => setIsLoaded(true)}
      onLoad={() => setIsLoaded(true)}
      ref={imageRef}
      sizes={sizes}
      src={src}
    />
  );
}
