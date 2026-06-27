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
          No pudimos cargar este producto. Intenta de nuevo mas tarde o volve al
          catalogo.
        </p>
        <Link className="button button--ghost" href="/">
          Volver al catalogo
        </Link>
      </div>
    </div>
  );
}
