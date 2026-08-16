"use client";

import { useEffect, useRef, useState } from "react";

type ProductContactButtonProps = {
  href: string;
};

export function ProductContactButton({ href }: ProductContactButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function showClickFeedback() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsClicked(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsClicked(false);
      timeoutRef.current = null;
    }, 260);
  }

  return (
    <a
      className={`button button--primary product-detail__contact-button${
        isClicked ? " product-detail__contact-button--clicked" : ""
      }`}
      href={href}
      onClick={showClickFeedback}
      onPointerDown={showClickFeedback}
      rel="noopener noreferrer"
      target="_blank"
    >
      Contactar con el vendedor
    </a>
  );
}
