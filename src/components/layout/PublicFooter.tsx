"use client";

import {
  ArrowUpRight,
  AtSign,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";

const CONTACT_EMAIL = "importvintage1@gmail.com";
const CONTACT_INSTAGRAM = "retro_campus";
const CONTACT_PHONE_LABEL = "+54 9 2223 57-6189";
const CONTACT_WHATSAPP_URL = "https://wa.me/5492223576189";
const INSTAGRAM_URL = `https://www.instagram.com/${CONTACT_INSTAGRAM}/`;
const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_PILLARS = [
  "Curaduria",
  "Estado claro",
  "Compra directa",
] as const;

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
      <div className="public-footer__marquee" aria-hidden="true">
        <span>Archivo curado</span>
        <span>Prendas con historia</span>
        <span>Compra directa</span>
      </div>

      <div className="public-footer__inner ui-page-container">
        <section className="public-footer__brand-block" aria-label="Retro Campus">
          <div className="public-footer__brand-row">
            <Link className="public-footer__brand" href="/">
              <BrandLogo
                className="public-footer__brand-logo"
                sizes="(max-width: 640px) 96px, 128px"
              />
            </Link>
            <p className="public-footer__edition">Archivo vintage seleccionado</p>
          </div>

          <div className="public-footer__content">
            <p className="public-footer__eyebrow">Curaduria con criterio</p>
            <p className="public-footer__lead">
              Vintage con caracter, listo para volver a circular.
            </p>
            <p>
              Cada prenda se elige por silueta, textura, estado y presencia. Un
              catalogo breve, claro y pensado para encontrar piezas con
              identidad sin perder tiempo.
            </p>
          </div>
        </section>

        <section className="public-footer__contact" aria-label="Datos de contacto">
          <div className="public-footer__contact-card">
            <div className="public-footer__contact-head">
              <span className="public-footer__contact-badge">
                <ShieldCheck aria-hidden="true" size={15} strokeWidth={1.9} />
                Compra directa
              </span>
              <h2>Consultas y reservas</h2>
              <p>
                Escribinos para consultar disponibilidad y coordinar compra.
              </p>
            </div>

            <div className="public-footer__links">
              <a
                className="public-footer__contact-link public-footer__contact-link--primary"
                href={CONTACT_WHATSAPP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle aria-hidden="true" size={18} strokeWidth={1.9} />
                <span className="public-footer__contact-copy">
                  <small>WhatsApp</small>
                  <strong>{CONTACT_PHONE_LABEL}</strong>
                </span>
                <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.9} />
              </a>

              <button
                aria-label={didCopyEmail ? "Mail copiado" : "Copiar mail"}
                className="public-footer__contact-link public-footer__contact-link--button"
                onClick={copyEmail}
                type="button"
              >
                <Mail aria-hidden="true" size={18} strokeWidth={1.9} />
                <span className="public-footer__contact-copy">
                  <small>{didCopyEmail ? "Mail copiado" : "Mail"}</small>
                  <strong>{CONTACT_EMAIL}</strong>
                </span>
                {didCopyEmail ? (
                  <Check aria-hidden="true" size={16} strokeWidth={2.1} />
                ) : (
                  <Copy aria-hidden="true" size={16} strokeWidth={1.9} />
                )}
              </button>

              <a
                className="public-footer__contact-link"
                href={INSTAGRAM_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <AtSign aria-hidden="true" size={18} strokeWidth={1.9} />
                <span className="public-footer__contact-copy">
                  <small>Instagram</small>
                  <strong>@{CONTACT_INSTAGRAM}</strong>
                </span>
                <ExternalLink aria-hidden="true" size={16} strokeWidth={1.9} />
              </a>
            </div>
          </div>
        </section>

        <section className="public-footer__proof" aria-label="Criterios de Retro Campus">
          <div className="public-footer__editorial-grid" aria-label="Valores de Retro Campus">
            {FOOTER_PILLARS.map((pillar, index) => (
              <div className="public-footer__pillar" key={pillar}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{pillar}</p>
              </div>
            ))}
          </div>

          <blockquote className="public-footer__quote">
            Elegir vintage es vestir algo que ya tiene recorrido, materia y una
            manera propia de contar quien sos.
          </blockquote>
        </section>
      </div>

      <div className="public-footer__bottom ui-page-container">
        <span>Lo bueno nunca pasa de moda.</span>
        <nav aria-label="Accesos del footer">
          <Link href="/">Catalogo</Link>
          <Link href="/?exclusive=true">Exclusivos</Link>
          <a href={INSTAGRAM_URL} rel="noopener noreferrer" target="_blank">
            Instagram
          </a>
        </nav>
        <span>{CURRENT_YEAR}</span>
      </div>
    </footer>
  );
}
