export function ProductCardSkeleton() {
  return (
    <article className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__image product-card__skeleton-media" />
      <div className="product-card__body">
        <div className="product-card__skeleton-line product-card__skeleton-brand" />
        <div className="product-card__skeleton-line product-card__skeleton-title" />
        <div className="product-card__ornament" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="product-card__skeleton-line product-card__skeleton-price" />
      </div>
      <div className="product-card__footer">
        <div className="product-card__skeleton-footer-group">
          <div className="product-card__skeleton-line product-card__skeleton-footer-label" />
          <div className="product-card__skeleton-line product-card__skeleton-footer-value" />
        </div>
        <div className="product-card__skeleton-status">
          <span />
          <div className="product-card__skeleton-line product-card__skeleton-status-text" />
        </div>
      </div>
    </article>
  );
}
