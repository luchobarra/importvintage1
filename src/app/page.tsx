import { getAvailableProducts, type Product } from "@/lib/products";
import Image from "next/image";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function Home() {
  let products: Product[] = [];
  let errorMessage = "";

  try {
    products = await getAvailableProducts();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "No se pudo conectar Supabase.";
  }

  return (
    <main className="home">
      <section className="home__container">
        <header className="home__header">
          <div>
            <p className="home__eyebrow">Catalogo online</p>
            <h1 className="home__title">Prendas disponibles</h1>
          </div>
          <a className="home__admin-link" href="/admin/login">
            Admin
          </a>
        </header>

        {errorMessage ? (
          <div className="home__empty-state home__empty-state--error">
            <div className="home__empty-content">
              <h2>Error de conexion</h2>
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="home__empty-state">
            <div className="home__empty-content">
              <h2>No hay prendas cargadas</h2>
              <p>
                La conexion con Supabase esta lista. Cuando carguemos productos
                desde el admin, van a aparecer en este catalogo.
              </p>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const mainImage = product.product_images[0];

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-card__image">
                    {mainImage ? (
                      <Image
                        src={mainImage.image_url}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1100px) 33vw, 260px"
                      />
                    ) : (
                      <span>Sin foto</span>
                    )}
                  </div>
                  <div className="product-card__body">
                    <p className="product-card__brand">{product.brand}</p>
                    <h2>{product.title}</h2>
                    <p className="product-card__meta">Talle {product.size}</p>
                    <p className="product-card__price">
                      {currencyFormatter.format(product.price)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
