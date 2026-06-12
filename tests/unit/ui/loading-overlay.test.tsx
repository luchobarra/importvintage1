import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("LoadingOverlay", () => {
  it("does not render when hidden", () => {
    render(<LoadingOverlay isVisible={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the loading message when visible", () => {
    render(<LoadingOverlay isVisible message="Guardando cambios..." />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Guardando cambios...",
    );
  });
});
