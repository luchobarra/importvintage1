"use client";

import { AtSign, Check, Copy, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";

const CONTACT_EMAIL = "importvintage1@gmail.com";
const CONTACT_INSTAGRAM = "oldtimes.vtg";
const CONTACT_PHONE_LABEL = "+54 9 2223 57-6189";
const CONTACT_WHATSAPP_URL = "https://wa.me/5492223576189";
const INSTAGRAM_URL = `https://www.instagram.com/${CONTACT_INSTAGRAM}/`;

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
          <p>
            Curamos prendas vintage con identidad, historia y estado cuidado.
            Seleccionamos piezas para que cada compra se sienta unica, usable y
            lista para volver a circular.
          </p>
        </section>

        <section className="public-footer__contact" aria-label="Datos de contacto">
          <p className="public-footer__eyebrow">Contacto</p>
          <div className="public-footer__links">
            <a
              className="public-footer__contact-link"
              href={CONTACT_WHATSAPP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>{CONTACT_PHONE_LABEL}</span>
            </a>

            <button
              aria-label={didCopyEmail ? "Mail copiado" : "Copiar mail"}
              className="public-footer__contact-link public-footer__contact-link--button"
              onClick={copyEmail}
              type="button"
            >
              <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>{CONTACT_EMAIL}</span>
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
              <span>@{CONTACT_INSTAGRAM}</span>
            </a>
          </div>
        </section>
      </div>
    </footer>
  );
}
