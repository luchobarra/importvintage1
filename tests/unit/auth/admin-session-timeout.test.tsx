import { AdminSessionTimeoutContainer } from "@/containers/auth/AdminSessionTimeoutContainer";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("AdminSessionTimeoutContainer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("expires the admin session when inactivity reaches the timeout", () => {
    const onSessionExpired = vi.fn();

    render(
      <AdminSessionTimeoutContainer
        onSessionExpired={onSessionExpired}
        timeoutMs={1000}
      >
        <div>Admin</div>
      </AdminSessionTimeoutContainer>,
    );

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(onSessionExpired).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("restarts the timeout when the user interacts with the admin", () => {
    const onSessionExpired = vi.fn();

    render(
      <AdminSessionTimeoutContainer
        onSessionExpired={onSessionExpired}
        timeoutMs={1000}
      >
        <div>Admin</div>
      </AdminSessionTimeoutContainer>,
    );

    act(() => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.keyDown(window, { key: "Tab" });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onSessionExpired).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
