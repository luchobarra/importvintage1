import { ProductGridContainer } from "@/containers/catalog/ProductGridContainer";

export default async function Home() {
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

        <ProductGridContainer />
      </section>
    </main>
  );
}
