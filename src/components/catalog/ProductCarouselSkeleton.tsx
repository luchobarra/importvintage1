const skeletonOffsets = [-3, -2, -1, 0, 1, 2, 3];

export function ProductCarouselSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="product-carousel product-carousel--detail product-carousel--skeleton"
    >
      <div className="product-carousel__header">
        <div className="product-carousel__copy">
          <div className="product-carousel__skeleton-eyebrow product-detail__skeleton" />
          <div className="product-carousel__skeleton-title product-detail__skeleton" />
        </div>
      </div>

      <div className="product-carousel__viewport">
        <div className="product-carousel__skeleton-button product-carousel__skeleton-button--prev product-detail__skeleton" />
        <div className="product-carousel__stage">
          {skeletonOffsets.map((offset) => (
            <div
              className="product-carousel__item"
              data-active={offset === 0 ? "true" : undefined}
              data-offset={offset}
              key={offset}
            >
              <div className="product-carousel-card product-carousel-card--skeleton">
                <span className="product-carousel-card__media product-detail__skeleton" />
              </div>
            </div>
          ))}
        </div>
        <div className="product-carousel__skeleton-button product-carousel__skeleton-button--next product-detail__skeleton" />
      </div>

      <div className="product-carousel__dots">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            className="product-carousel__dot product-carousel__dot--skeleton"
            key={index}
          />
        ))}
      </div>
    </section>
  );
}
