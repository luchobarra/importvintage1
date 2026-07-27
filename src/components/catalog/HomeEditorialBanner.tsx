import Link from "next/link";

const editorialBanner = {
  cta: "Ver prendas",
  description:
    "Prendas con historia, caracter e identidad. Seleccionadas para quienes buscan algo mas que ropa.",
  href: "/#productos",
  title: "Lo autentico nunca pasa de moda.",
};

export function HomeEditorialBanner() {
  return (
    <section
      aria-label="Historia principal del catalogo vintage"
      className="home-editorial-banner"
    >
      <div className="home-editorial-banner__viewport">
        <div className="home-editorial-banner__track">
          <article className="home-editorial-banner__card home-editorial-banner__card--main">
            <span className="home-editorial-banner__media" />
            <span className="home-editorial-banner__shade" />
            <span className="home-editorial-banner__content">
              <span className="home-editorial-banner__title">
                {editorialBanner.title}
              </span>
              <span className="home-editorial-banner__description">
                {editorialBanner.description}
              </span>
              <Link
                className="home-editorial-banner__cta"
                href={editorialBanner.href}
              >
                {editorialBanner.cta}
              </Link>
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
