import { describe, expect, it } from "vitest";
import { createFakeAuthClient } from "@/test/fakeAuthClient";
import { createSessionEnsurer } from "./anonymousSession";

describe("ensureSession (sesión anónima perezosa)", () => {
  it("reuses an existing session without creating another", async () => {
    const fake = createFakeAuthClient({ session: { user: { id: "account-1", is_anonymous: false } } });
    const ensureSession = createSessionEnsurer(fake.client);

    expect(await ensureSession()).toEqual({ ok: true, userId: "account-1" });
    expect(fake.calls).toEqual([]);
  });

  it("creates an anonymous session only when called, passing the captcha token", async () => {
    const fake = createFakeAuthClient();
    const ensureSession = createSessionEnsurer(fake.client);
    expect(fake.calls).toEqual([]);

    expect(await ensureSession("captcha-token")).toEqual({ ok: true, userId: "anon-1" });
    expect(fake.calls).toEqual([
      { name: "signInAnonymously", args: { options: { captchaToken: "captcha-token" } } },
    ]);
  });

  it("creates a single anonymous user when several sends race", async () => {
    const fake = createFakeAuthClient();
    const ensureSession = createSessionEnsurer(fake.client);

    const results = await Promise.all([ensureSession(), ensureSession(), ensureSession()]);

    expect(results.map((result) => result.ok && result.userId)).toEqual(["anon-1", "anon-1", "anon-1"]);
    expect(fake.calls.filter((call) => call.name === "signInAnonymously")).toHaveLength(1);
  });

  it("reports a failure and lets a later attempt retry", async () => {
    const fake = createFakeAuthClient({
      failNext: { signInAnonymously: { code: "captcha_failed", message: "" } },
    });
    const ensureSession = createSessionEnsurer(fake.client);

    expect(await ensureSession()).toEqual({ ok: false, reason: "captcha-failed" });
    expect(await ensureSession()).toEqual({ ok: true, userId: "anon-1" });
  });
});
