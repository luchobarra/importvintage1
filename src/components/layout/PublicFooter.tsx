"use client";

import { AtSign, Check, Copy, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CONTACT_EMAIL = "importvintage1@gmail.com";
const CONTACT_INSTAGRAM = "oldtimes.vtg";
const CONTACT_PHONE_LABEL = "+54 9 2223 57-6189";
const CONTACT_WHATSAPP_URL = "https://wa.me/5492223576189";
const INSTAGRAM_URL = `https://www.instagram.com/${CONTACT_INSTAGRAM}/`;
const CURRENT_YEAR = new Date().getFullYear();

export function PublicFooter() {
  const [didCopyEmail, setDidCopyEmail] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setDidCopyEmail(true);
      window.setTimeout(() => setDidCopyEmail(false), 1800);
    } catch {
      setDidCopyEmail(false);
    }
  }

  return (
    <footer className="public-footer" id="contacto">
      <div className="public-footer__inner ui-page-container">
        <section className="public-footer__brand-block" aria-label="Old Times Vintage">
          <div className="public-footer__brand">
            <span className="public-header__brand-kicker">Old Times</span>
            <span className="public-header__brand-mark">
              <span aria-hidden="true" />
              Vintage
              <span aria-hidden="true" />
            </span>
          </div>
          <div className="public-footer__content">
            <p className="public-footer__lead">
              Archivo de prendas seleccionadas, piezas unicas y hallazgos con
              historia.
            </p>
            <p>
              Cada pieza se publica con talle, estado y disponibilidad actual
              para que el catalogo se lea claro, directo y con criterio.
            </p>
          </div>
          <nav className="public-footer__directory" aria-label="Indice editorial">
            <div>
              <p>Catalogo</p>
              <Link href="/">Todas las prendas</Link>
              <Link href="/?exclusive=true">Exclusivos</Link>
            </div>
            <div>
              <p>Curaduria</p>
              <span>Piezas unicas</span>
              <span>Estado revisado</span>
            </div>
            <div>
              <p>Archivo</p>
              <span>Vintage diario</span>
              <span>Seleccion vigente</span>
            </div>
          </nav>
        </section>

        <section className="public-footer__contact" aria-label="Datos de contacto">
          <div className="public-footer__contact-head">
            <p className="public-footer__eyebrow">Contacto</p>
            <p>Consultas, reservas y coordinacion de compra.</p>
          </div>
          <div className="public-footer__links">
            <a
              className="public-footer__contact-link"
              href={CONTACT_WHATSAPP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" size={17} strokeWidth={1.8} />
              <span className="public-footer__contact-copy">
                <small>WhatsApp</small>
                <strong>{CONTACT_PHONE_LABEL}</strong>
              </span>
            </a>

            <button
              aria-label={didCopyEmail ? "Mail copiado" : "Copiar mail"}
              className="public-footer__contact-link public-footer__contact-link--button"
              onClick={copyEmail}
              type="button"
            >
              <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
              <span className="public-footer__contact-copy">
                <small>{didCopyEmail ? "Mail copiado" : "Mail"}</small>
                <strong>{CONTACT_EMAIL}</strong>
              </span>
              {didCopyEmail ? (
                <Check aria-hidden="true" size={15} strokeWidth={2} />
              ) : (
                <Copy aria-hidden="true" size={15} strokeWidth={1.8} />
              )}
            </button>

            <a
              className="public-footer__contact-link"
              href={INSTAGRAM_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <AtSign aria-hidden="true" size={17} strokeWidth={1.8} />
              <span className="public-footer__contact-copy">
                <small>Instagram</small>
                <strong>@{CONTACT_INSTAGRAM}</strong>
              </span>
            </a>
          </div>
        </section>
      </div>
      <div className="public-footer__bottom ui-page-container">
        <span>Lo bueno nunca pasa de moda.</span>
        <span>{CURRENT_YEAR}</span>
      </div>
    </footer>
  );
}
