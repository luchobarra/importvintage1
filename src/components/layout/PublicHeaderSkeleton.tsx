export function PublicHeaderSkeleton() {
  return (
    <header className="public-header public-header--skeleton" aria-hidden="true">
      <div className="public-header__inner ui-page-container">
        <div className="public-header__skeleton-menu product-detail__skeleton">
          <span />
          <span />
          <span />
        </div>

        <div className="public-header__identity public-header__skeleton-identity">
          <div className="public-header__skeleton-kicker product-detail__skeleton" />
          <div className="public-header__skeleton-brand">
            <span className="product-detail__skeleton" />
            <div className="product-detail__skeleton" />
            <span className="product-detail__skeleton" />
          </div>
          <div className="public-header__skeleton-mobile-tagline product-detail__skeleton" />
        </div>

        <div className="public-header__nav public-header__skeleton-nav">
          <div className="public-header__skeleton-nav-item product-detail__skeleton" />
          <div className="public-header__skeleton-nav-item product-detail__skeleton" />
          <div className="public-header__skeleton-nav-item product-detail__skeleton" />
        </div>

        <div className="public-header__skeleton-tagline product-detail__skeleton" />
        <span className="public-header__mobile-spacer" />
      </div>
    </header>
  );
}
