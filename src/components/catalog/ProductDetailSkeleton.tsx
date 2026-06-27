export function ProductDetailSkeleton() {
  return (
    <div className="product-detail product-detail--loading" aria-hidden="true">
      <div className="product-detail__media-column">
        <div className="product-detail__gallery">
          <div className="product-detail__thumbs">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                className="product-detail__thumb product-detail__skeleton"
                key={index}
              />
            ))}
          </div>
          <div className="product-detail__main-image product-detail__skeleton" />
        </div>
      </div>
      <div className="product-detail__content-column">
        <div className="product-detail__heading">
          <div className="product-detail__skeleton product-detail__skeleton-eyebrow" />
          <div className="product-detail__skeleton product-detail__skeleton-title" />
          <div className="product-detail__skeleton product-detail__skeleton-title product-detail__skeleton-title--short" />
        </div>
        <div className="product-detail__info">
          <div className="product-detail__skeleton product-detail__skeleton-price" />

          <div className="product-detail__skeleton-meta-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="product-detail__skeleton-meta-item" key={index}>
                <div className="product-detail__skeleton-meta-icon product-detail__skeleton" />
                <div className="product-detail__skeleton-meta-copy">
                  <div className="product-detail__skeleton product-detail__skeleton-meta-label" />
                  <div className="product-detail__skeleton product-detail__skeleton-meta-value" />
                </div>
              </div>
            ))}
          </div>

          <div className="product-detail__skeleton-description">
            <div className="product-detail__skeleton product-detail__skeleton-description-title" />
            <div className="product-detail__skeleton product-detail__skeleton-description-line" />
            <div className="product-detail__skeleton product-detail__skeleton-description-line" />
            <div className="product-detail__skeleton product-detail__skeleton-description-line product-detail__skeleton-description-line--short" />
          </div>

          <div className="product-detail__skeleton-actions">
            <div className="product-detail__skeleton product-detail__skeleton-action" />
            <div className="product-detail__skeleton product-detail__skeleton-back-link" />
          </div>
        </div>
      </div>
    </div>
  );
}
