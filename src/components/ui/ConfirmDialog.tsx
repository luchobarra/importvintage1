import { useId } from "react";

type ConfirmDialogVariant = "default" | "danger";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  isPending?: boolean;
  title: string;
  variant?: ConfirmDialogVariant;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  description,
  isOpen,
  isPending = false,
  title,
  variant = "default",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog" role="presentation">
      <button
        aria-label="Cerrar confirmación"
        className="confirm-dialog__backdrop"
        disabled={isPending}
        onClick={onCancel}
        type="button"
      />
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`confirm-dialog__panel confirm-dialog__panel--${variant}`}
        role="dialog"
      >
        <div className="confirm-dialog__content">
          <h2 id={titleId} className="text-h2">
            {title}
          </h2>
          <p id={descriptionId} className="text-body">
            {description}
          </p>
        </div>

        <div className="confirm-dialog__actions">
          <button
            className={`button button--secondary${
              variant === "danger" ? " confirm-dialog__safe-action" : ""
            }`}
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`button button--primary${
              variant === "danger" ? " button--danger" : ""
            }`}
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
