"use client";

import { createPublicProductDetailHref } from "@/features/products/public-filters";
import { getProductBrandName } from "@/features/products/formatters";
import type { Product } from "@/features/products/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProductCarouselProps = {
  catalogHref: string;
  eyebrow?: string;
  products: Product[];
  title: string;
};

export function ProductCarousel({
  catalogHref,
  eyebrow,
  products,
  title,
}: ProductCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (products.length === 0) {
    return null;
  }

  const activeIndex = Math.min(selectedIndex, products.length - 1);

  function selectProduct(index: number) {
    if (products.length === 0) {
      return;
    }

    setSelectedIndex((index + products.length) % products.length);
  }

  function selectRelativeProduct(direction: "back" | "forward") {
    selectProduct(activeIndex + (direction === "forward" ? 1 : -1));
  }

  return (
    <section
      className="product-carousel product-carousel--detail"
      aria-labelledby="product-carousel-detail"
    >
      <div className="product-carousel__header">
        <div className="product-carousel__copy">
          {eyebrow ? <p className="product-carousel__eyebrow">{eyebrow}</p> : null}
          <h2 className="product-carousel__title" id="product-carousel-detail">
            {title}
          </h2>
        </div>
      </div>

      <div className="product-carousel__viewport">
        <button
          aria-label="Ver productos anteriores"
          className="product-carousel__button product-carousel__button--prev"
          disabled={products.length <= 1}
          onClick={() => selectRelativeProduct("back")}
          type="button"
        >
          <ChevronLeft size={20} strokeWidth={1.8} />
        </button>
        <div className="product-carousel__stage">
          {products.map((product, index) => {
            const offset = getCarouselOffset(index, activeIndex, products.length);
            const isActive = index === activeIndex;

            return (
              <div
                className="product-carousel__item"
                data-active={isActive ? "true" : undefined}
                data-offset={offset}
                hidden={Math.abs(offset) > 3}
                key={product.id}
              >
                <CarouselProductLink
                  catalogHref={catalogHref}
                  isActive={isActive}
                  index={index}
                  product={product}
                />
              </div>
            );
          })}
        </div>
        <button
          aria-label="Ver mas productos"
          className="product-carousel__button product-carousel__button--next"
          disabled={products.length <= 1}
          onClick={() => selectRelativeProduct("forward")}
          type="button"
        >
          <ChevronRight size={20} strokeWidth={1.8} />
        </button>
      </div>

      {products.length > 1 ? (
        <div className="product-carousel__dots" aria-label="Seleccionar producto">
          {products.map((product, index) => (
            <button
              aria-label={`Ver producto ${index + 1} de ${products.length}`}
              aria-pressed={index === activeIndex}
              className="product-carousel__dot"
              key={product.id}
              onClick={() => selectProduct(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

type CarouselProductLinkProps = {
  catalogHref: string;
  isActive: boolean;
  index: number;
  product: Product;
};

function CarouselProductLink({
  catalogHref,
  isActive,
  index,
  product,
}: CarouselProductLinkProps) {
  const brandName = getProductBrandName(product);
  const mainImage = product.product_images[0];

  return (
    <Link
      aria-label={`Ver detalle de ${product.title} de ${brandName}`}
      aria-current={isActive ? "true" : undefined}
      className="product-carousel-card"
      href={createPublicProductDetailHref(product.id, catalogHref)}
    >
      <span className="product-carousel-card__media">
        {mainImage ? (
          <Image
            alt={`${product.title} de ${brandName}`}
            fill
            loading={index < 4 ? "eager" : "lazy"}
            sizes="(max-width: 640px) 72vw, (max-width: 960px) 42vw, 320px"
            src={mainImage.image_url}
          />
        ) : (
          <span className="product-carousel-card__empty">Sin foto</span>
        )}
      </span>
    </Link>
  );
}

function getCarouselOffset(index: number, activeIndex: number, productCount: number) {
  if (productCount <= 1) {
    return 0;
  }

  const rawOffset = index - activeIndex;

  if (rawOffset > productCount / 2) {
    return rawOffset - productCount;
  }

  if (rawOffset < -productCount / 2) {
    return rawOffset + productCount;
  }

  return rawOffset;
}
