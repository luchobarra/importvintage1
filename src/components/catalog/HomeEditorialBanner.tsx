import Link from "next/link";

const editorialBanner = {
  cta: "Ver prendas",
  description:
    "Una seleccion de ropa vintage con identidad, calidad y presencia. Piezas elegidas para quienes buscan vestir algo propio.",
  href: "/#productos",
  title: "Retro Campus",
};

export function HomeEditorialBanner() {
  return (
    <section
      aria-label="Historia principal de Retro Campus"
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
