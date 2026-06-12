type LoadingOverlayProps = {
  isVisible: boolean;
  message?: string;
};

export function LoadingOverlay({
  isVisible,
  message = "Procesando...",
}: LoadingOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-overlay__panel">
        <span className="loading-overlay__spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  );
}
