import { describe, expect, it } from "vitest";
import { createFakeAuthClient } from "@/test/fakeAuthClient";
import { createEmailOtpChannel } from "./emailOtpChannel";

const EMAIL = "paciente@correo.pe";

describe("EmailOtpChannel", () => {
  describe("sendCode", () => {
    it("rejects an invalid email without calling Supabase", async () => {
      const fake = createFakeAuthClient();
      const channel = createEmailOtpChannel(fake.client);

      expect(await channel.sendCode("no-es-correo")).toEqual({ ok: false, reason: "invalid-destination" });
      expect(fake.calls).toEqual([]);
    });

    it("signs in with a 6-digit OTP (no magic link, no password) when there is no session", async () => {
      const fake = createFakeAuthClient();
      const channel = createEmailOtpChannel(fake.client);

      expect(await channel.sendCode(`  ${EMAIL.toUpperCase()} `, "captcha-token")).toEqual({ ok: true });
      expect(fake.calls).toEqual([
        {
          name: "signInWithOtp",
          args: { email: EMAIL, options: { shouldCreateUser: true, captchaToken: "captcha-token" } },
        },
      ]);
    });

    it("upgrades an anonymous guest by attaching the email, so auth.uid() is kept", async () => {
      const fake = createFakeAuthClient({ session: { user: { id: "anon-guest", is_anonymous: true } } });
      const channel = createEmailOtpChannel(fake.client);

      expect(await channel.sendCode(EMAIL)).toEqual({ ok: true });
      expect(fake.calls).toEqual([{ name: "updateUser", args: { email: EMAIL } }]);

      expect(await channel.verifyCode(EMAIL, "123456")).toEqual({ ok: true });
      expect(fake.calls.at(-1)).toEqual({
        name: "verifyOtp",
        args: { email: EMAIL, token: "123456", type: "email_change" },
      });
      expect(fake.currentSession()?.user).toEqual({ id: "anon-guest", is_anonymous: false, email: EMAIL });
    });

    it("falls back to signing in when the guest's email already has an account", async () => {
      const fake = createFakeAuthClient({
        session: { user: { id: "anon-guest", is_anonymous: true } },
        failNext: { updateUser: { code: "email_exists", message: "exists" } },
      });
      const channel = createEmailOtpChannel(fake.client);

      expect(await channel.sendCode(EMAIL)).toEqual({ ok: true });
      expect(fake.calls.map((call) => call.name)).toEqual(["updateUser", "signInWithOtp"]);

      await channel.verifyCode(EMAIL, "123456");
      expect(fake.calls.at(-1)?.args).toMatchObject({ type: "email" });
    });

    it.each([
      [{ code: "over_email_send_rate_limit", message: "", status: 429 }, "rate-limited"],
      [{ code: "captcha_failed", message: "" }, "captcha-failed"],
      [{ message: "network down" }, "unavailable"],
    ] as const)("maps Supabase error %o to %s", async (error, reason) => {
      const fake = createFakeAuthClient({ failNext: { signInWithOtp: error } });
      const channel = createEmailOtpChannel(fake.client);

      expect(await channel.sendCode(EMAIL)).toEqual({ ok: false, reason });
    });
  });

  describe("verifyCode", () => {
    it("rejects codes that are not exactly 6 digits without calling Supabase", async () => {
      const fake = createFakeAuthClient();
      const channel = createEmailOtpChannel(fake.client);

      for (const code of ["12345", "1234567", "12a456", ""]) {
        expect(await channel.verifyCode(EMAIL, code)).toEqual({ ok: false, reason: "invalid-code" });
      }
      expect(fake.calls).toEqual([]);
    });

    it("reports a wrong or expired code", async () => {
      const fake = createFakeAuthClient();
      const channel = createEmailOtpChannel(fake.client);
      await channel.sendCode(EMAIL);

      expect(await channel.verifyCode(EMAIL, "000000")).toEqual({ ok: false, reason: "invalid-code" });
    });

    it("accepts spaces the patient may type between digits", async () => {
      const fake = createFakeAuthClient();
      const channel = createEmailOtpChannel(fake.client);
      await channel.sendCode(EMAIL);

      expect(await channel.verifyCode(EMAIL, "123 456")).toEqual({ ok: true });
    });
  });
});
