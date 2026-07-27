"use client";

import Link from "next/link";
import { useState } from "react";

const editorialCards = [
  {
    className: "home-editorial-banner__card--main",
    cta: "Ver prendas",
    description:
      "Prendas con historia, caracter e identidad. Seleccionadas para quienes buscan algo mas que ropa.",
    eyebrow: "",
    href: "/#productos",
    title: "Lo autentico nunca pasa de moda.",
  },
  {
    className: "home-editorial-banner__card--connection",
    cta: "Encontrar la tuya",
    description:
      "No buscamos que una prenda le quede a todos. Buscamos que alguien la mire y sienta que estaba esperando por esa persona.",
    eyebrow: "Conexion",
    href: "/#productos",
    title: "Hecha para alguien",
  },
  {
    className: "home-editorial-banner__card--exclusive",
    cta: "Ver exclusivos",
    description:
      "Una pieza, una historia, sin reposicion infinita. Seleccionamos prendas con rareza, calidad y presencia.",
    eyebrow: "Seleccion",
    href: "/?exclusivos=1",
    title: "Piezas exclusivas",
  },
];

export function HomeEditorialBanner() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      aria-label="Historias del catalogo vintage"
      className="home-editorial-banner"
    >
      <div className="home-editorial-banner__viewport">
        <div
          className="home-editorial-banner__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {editorialCards.map((card, index) => (
            <article
              aria-current={activeIndex === index ? "true" : undefined}
              className={`home-editorial-banner__card ${card.className}`}
              key={card.title}
            >
              <span className="home-editorial-banner__media" />
              <span className="home-editorial-banner__shade" />
              <span className="home-editorial-banner__content">
                {card.eyebrow ? (
                  <span className="home-editorial-banner__eyebrow">
                    {card.eyebrow}
                  </span>
                ) : null}
                <span className="home-editorial-banner__title">
                  {card.title}
                </span>
                <span className="home-editorial-banner__description">
                  {card.description}
                </span>
                <Link
                  className="home-editorial-banner__cta"
                  href={card.href}
                  tabIndex={activeIndex === index ? undefined : -1}
                >
                  {card.cta}
                </Link>
              </span>
            </article>
          ))}
        </div>

      </div>

      <div className="home-editorial-banner__dots" role="tablist">
        {editorialCards.map((card, index) => (
          <button
            aria-label={`Ver ${card.title}`}
            aria-selected={activeIndex === index}
            className="home-editorial-banner__dot"
            key={card.title}
            onClick={() => setActiveIndex(index)}
            role="tab"
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
