export function ProductDetailSkeleton() {
  return (
    <div className="product-detail product-detail--loading" aria-hidden="true">
      <div className="product-detail__images">
        <div className="product-detail__main-image product-detail__skeleton" />
      </div>
      <div className="product-detail__info">
        <div className="product-detail__skeleton product-detail__skeleton-line product-detail__skeleton-line--short" />
        <div className="product-detail__skeleton product-detail__skeleton-title" />
        <div className="product-detail__skeleton product-detail__skeleton-line" />
        <div className="product-detail__skeleton product-detail__skeleton-line" />
      </div>
    </div>
  );
}
