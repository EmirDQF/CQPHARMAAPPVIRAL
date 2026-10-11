import { describe, expect, it, vi } from "vitest";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import { resolveDeepLink } from "@/lib/native/deepLinks";
import { INVITE_COPY, buildInviteUrl, shareInvite, type ShareDependencies } from "./inviteShare";

const SITE = "https://artikare.com";

function deps(overrides: Partial<ShareDependencies> = {}): ShareDependencies {
  return {
    isNativeApp: () => false,
    nativeShare: vi.fn(async () => undefined),
    webShare: undefined,
    openUrl: vi.fn(),
    ...overrides,
  };
}

describe("invite copy", () => {
  it.each(Object.entries(INVITE_COPY))("%s copy is allowed, orientative and carries no result", (_audience, copy) => {
    expect(findForbiddenPhrases(copy)).toEqual([]);
    expect(copy).toMatch(/orientativo/);
    expect(copy).not.toMatch(/\d+\s*años|riesgo|osteop|t-?score/i);
  });
});

describe("buildInviteUrl", () => {
  it("points to /test with family-referral UTMs that the deep link handler accepts", () => {
    const url = buildInviteUrl(SITE, "familiar", "whatsapp");

    expect(url).toBe("https://artikare.com/test?utm_source=whatsapp&utm_medium=compartir&utm_campaign=derivacion-familiar");
    expect(resolveDeepLink(url, SITE)).toBe("/test?utm_source=whatsapp&utm_medium=compartir&utm_campaign=derivacion-familiar");
  });
});

describe("shareInvite", () => {
  it("uses the native share sheet inside the app", async () => {
    const dependencies = deps({ isNativeApp: () => true, webShare: vi.fn(async () => undefined) });

    await expect(shareInvite("familiar", SITE, dependencies)).resolves.toBe("shared");
    expect(dependencies.nativeShare).toHaveBeenCalledWith(
      expect.objectContaining({ text: INVITE_COPY.familiar, url: expect.stringContaining("utm_source=app") })
    );
    expect(dependencies.webShare).not.toHaveBeenCalled();
  });

  it("uses navigator.share on the web and respects a cancellation", async () => {
    const abort = Object.assign(new Error("cancelado"), { name: "AbortError" });
    const dependencies = deps({ webShare: vi.fn(async () => Promise.reject(abort)) });

    await expect(shareInvite("autoevaluacion", SITE, dependencies)).resolves.toBe("cancelled");
    expect(dependencies.openUrl).not.toHaveBeenCalled();
  });

  it("falls back to WhatsApp when there is no share sheet or it fails", async () => {
    const withoutShare = deps();
    await expect(shareInvite("familiar", SITE, withoutShare)).resolves.toBe("whatsapp");
    expect(withoutShare.openUrl).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/\?text=Hola/));

    const failing = deps({ webShare: vi.fn(async () => Promise.reject(new Error("NotAllowedError"))) });
    await expect(shareInvite("familiar", SITE, failing)).resolves.toBe("whatsapp");
  });

  it("reports a native failure instead of throwing", async () => {
    const dependencies = deps({
      isNativeApp: () => true,
      nativeShare: vi.fn(async () => Promise.reject(new Error("plugin"))),
    });

    await expect(shareInvite("familiar", SITE, dependencies)).resolves.toBe("failed");
  });
});
