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
    getLaunchUrl: vi.fn<() => Promise<{ url: string } | undefined>>(async () => undefined),
    addListener: vi.fn(async (_event: string, listener: UrlOpenListener) => {
      state.listener = listener;
      return { remove: mocks.remove };
    }),
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/native/doseNotifications", () => ({ isNativeApp: mocks.isNativeApp }));
vi.mock("@capacitor/app", () => ({
  App: { addListener: mocks.addListener, getLaunchUrl: mocks.getLaunchUrl },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.listener = null;
  mocks.isNativeApp.mockReturnValue(true);
  mocks.getLaunchUrl.mockResolvedValue(undefined);
  window.sessionStorage.clear();
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

  it("opens the app's own scheme like a public link", async () => {
    render(<DeepLinkListener />);
    await waitFor(() => expect(mocks.state.listener).not.toBeNull());

    mocks.state.listener?.({ url: "artikare://blog/mito-gelatina" });
    mocks.state.listener?.({ url: "artikare://app/reporte-medico" });

    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/blog/mito-gelatina");
  });

  it("opens the link that launched the app from a cold start", async () => {
    mocks.getLaunchUrl.mockResolvedValue({ url: "https://artikare.com/test?utm_campaign=derivacion-familiar" });

    render(<DeepLinkListener />);

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/test?utm_campaign=derivacion-familiar"));
  });

  it("does not reopen the launch link when the WebView reloads in the same session", async () => {
    mocks.getLaunchUrl.mockResolvedValue({ url: "https://artikare.com/test" });
    const first = render(<DeepLinkListener />);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
    first.unmount();

    render(<DeepLinkListener />);
    await waitFor(() => expect(mocks.getLaunchUrl).toHaveBeenCalledTimes(2));

    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it("ignores a launch link that is not shareable", async () => {
    mocks.getLaunchUrl.mockResolvedValue({ url: "https://artikare.com/app/reporte-medico" });

    render(<DeepLinkListener />);
    await waitFor(() => expect(mocks.getLaunchUrl).toHaveBeenCalled());

    expect(mocks.push).not.toHaveBeenCalled();
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
