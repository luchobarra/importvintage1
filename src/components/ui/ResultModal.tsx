import { useEffect, useId } from "react";

export type ResultModalVariant = "success" | "error";

type ResultModalProps = {
  autoCloseMs?: number;
  description: string;
  isOpen: boolean;
  title: string;
  variant: ResultModalVariant;
  onClose: () => void;
};

export function ResultModal({
  autoCloseMs,
  description,
  isOpen,
  title,
  variant,
  onClose,
}: ResultModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isSuccess = variant === "success";

  useEffect(() => {
    if (!isOpen || !autoCloseMs || !isSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, autoCloseMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoCloseMs, isOpen, isSuccess, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="result-modal" role="presentation">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-live="polite"
        aria-modal="true"
        className={`result-modal__panel result-modal__panel--${variant}`}
        role="dialog"
      >
        <span className="result-modal__badge" aria-hidden="true">
          {isSuccess ? "OK" : "!"}
        </span>
        <div className="result-modal__content">
          <h2 id={titleId} className="text-h2">
            {title}
          </h2>
          <p id={descriptionId} className="text-body">
            {description}
          </p>
        </div>
        <div className="result-modal__actions">
          <button className="button button--secondary" onClick={onClose} type="button">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
