import Link from "next/link";

export function ProductDetailError() {
  return (
    <div className="product-detail-error" role="alert">
      <div className="product-detail-error__panel">
        <p className="product-detail-error__eyebrow">Producto no disponible</p>
        <h1>Algo salio mal</h1>
        <p>
          No pudimos cargar este producto. Intenta de nuevo mas tarde o volve al
          catalogo.
        </p>
        <Link className="button button--primary" href="/">
          Volver al catalogo
        </Link>
      </div>
    </div>
  );
}
