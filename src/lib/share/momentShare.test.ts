import { describe, expect, it, vi } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { GAME_UNLOCKS } from "../gamification/unlocks";
import { resolveDeepLink } from "../native/deepLinks";
import { shareContent } from "./inviteShare";
import { buildMomentPayload, buildMomentUrl, buildShareCard, shareMomentSchema, type ShareMoment } from "./momentShare";

const SITE = "https://artikare.com";
const HEALTH = /dolor|rigidez|t-score|osteo|densitometr|c[aá]psula|col[aá]geno|magnesio|tratamiento con|diagn[oó]stic|-\d\.\d/i;

const MOMENTS: ShareMoment[] = [
  { kind: "streak", days: 7 },
  { kind: "streak", days: 1 },
  ...GAME_UNLOCKS.filter((unlock) => unlock.shareable).map((unlock): ShareMoment => ({ kind: "badge", unlockId: unlock.id })),
  { kind: "invite-parent" },
];

describe("shareable moments", () => {
  it.each(MOMENTS.map((moment) => [JSON.stringify(moment), moment] as const))("%s carries brand, disclaimer and no health data", (_label, moment) => {
    const { text, title } = buildMomentPayload(moment, SITE);
    expect(title).toMatch(/Artikare/);
    expect(text).toMatch(/no reemplaza la consulta con tu médico/);
    expect(text).not.toMatch(HEALTH);
    expect(findForbiddenPhrases(text)).toEqual([]);
  });

  it("speaks naturally about one day", () => {
    expect(buildShareCard({ kind: "streak", days: 1 }).headline).toBe("¡Mi racha de 1 día!");
  });

  it("rejects free text, unknown badges and absurd streaks at the boundary", () => {
    expect(shareMomentSchema.safeParse({ kind: "badge", unlockId: "primera-mision" }).success).toBe(false);
    expect(shareMomentSchema.safeParse({ kind: "streak", days: 0 }).success).toBe(false);
    expect(shareMomentSchema.safeParse({ kind: "streak", days: 7, name: "Rosa" }).success).toBe(true);
    expect(buildMomentPayload({ kind: "streak", days: 7, name: "Rosa" } as ShareMoment, SITE).text).not.toMatch(/Rosa/);
  });

  it("links to the test with family-referral UTMs that the deep-link filter keeps", () => {
    const url = buildMomentUrl(SITE, { kind: "invite-parent" }, "whatsapp");
    expect(url).toBe("https://artikare.com/test?utm_source=whatsapp&utm_medium=compartir&utm_campaign=derivacion-familiar");
    expect(resolveDeepLink(url, SITE)).toBe("/test?utm_source=whatsapp&utm_medium=compartir&utm_campaign=derivacion-familiar");
  });

  it("falls back to WhatsApp when there is no native or web share", async () => {
    const openUrl = vi.fn();
    const outcome = await shareContent(buildMomentPayload({ kind: "streak", days: 3 }, SITE), {
      isNativeApp: () => false,
      nativeShare: vi.fn(),
      openUrl,
    });
    expect(outcome).toBe("whatsapp");
    expect(openUrl.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(openUrl.mock.calls[0][0])).toMatch(/utm_campaign=racha/);
  });
});
