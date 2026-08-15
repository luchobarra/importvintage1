import Link from "next/link";

export function ProductDetailError() {
  return (
    <div className="product-detail-error" role="alert">
      <div className="product-detail-error__panel ui-panel">
        <p className="product-detail-error__eyebrow text-overline">
          Producto no disponible
        </p>
        <h1 className="text-h1">Algo salio mal</h1>
        <p className="text-body">
          No pudimos cargar este producto. Intentá de nuevo más tarde o volvé al
          catálogo.
        </p>
        <Link className="button button--ghost product-detail__back-link" href="/">
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
