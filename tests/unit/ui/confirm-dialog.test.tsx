import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ConfirmDialog", () => {
  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        description="Description"
        isOpen={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="Title"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls cancel and confirm handlers", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        cancelLabel="No"
        confirmLabel="Si"
        description="Description"
        isOpen
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Title"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Si" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
