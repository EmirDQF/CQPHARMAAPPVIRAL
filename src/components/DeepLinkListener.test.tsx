// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeepLinkListener } from "./DeepLinkListener";

type UrlOpenListener = (event: { url: string }) => void;

const mocks = vi.hoisted(() => {
  const state = { listener: null as UrlOpenListener | null };
  return {
    state,
    push: vi.fn(),
    isNativeApp: vi.fn(() => true),
    remove: vi.fn(async () => undefined),
    addListener: vi.fn(async (_event: string, listener: UrlOpenListener) => {
      state.listener = listener;
      return { remove: mocks.remove };
    }),
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/native/doseNotifications", () => ({ isNativeApp: mocks.isNativeApp }));
vi.mock("@capacitor/app", () => ({ App: { addListener: mocks.addListener } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.listener = null;
  mocks.isNativeApp.mockReturnValue(true);
});

describe("DeepLinkListener", () => {
  it("navigates to validated shareable links and ignores everything else", async () => {
    render(<DeepLinkListener />);
    await waitFor(() => expect(mocks.state.listener).not.toBeNull());

    mocks.state.listener?.({ url: "https://artikare.com/test?utm_source=whatsapp&nombre=Ana" });
    mocks.state.listener?.({ url: "https://evil.example/test" });
    mocks.state.listener?.({ url: "https://artikare.com/app/reporte-medico" });

    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/test?utm_source=whatsapp");
  });

  it("removes the listener on unmount", async () => {
    const { unmount } = render(<DeepLinkListener />);
    await waitFor(() => expect(mocks.state.listener).not.toBeNull());

    unmount();

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(1));
  });

  it("does nothing on the web", () => {
    mocks.isNativeApp.mockReturnValue(false);
    render(<DeepLinkListener />);
    expect(mocks.addListener).not.toHaveBeenCalled();
  });
});
