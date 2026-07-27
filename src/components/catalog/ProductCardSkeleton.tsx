export function ProductCardSkeleton() {
  return (
    <article className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__image product-card__skeleton-media" />
      <div className="product-card__body">
        <div className="product-card__kicker-row">
          <div className="product-card__skeleton-line product-card__skeleton-brand" />
          <div className="product-card__skeleton-status">
            <span />
            <div className="product-card__skeleton-line product-card__skeleton-status-text" />
          </div>
        </div>
        <div className="product-card__skeleton-line product-card__skeleton-title" />
        <div className="product-card__skeleton-line product-card__skeleton-price" />
        <div className="product-card__skeleton-line product-card__skeleton-meta" />
      </div>
    </article>
  );
}
