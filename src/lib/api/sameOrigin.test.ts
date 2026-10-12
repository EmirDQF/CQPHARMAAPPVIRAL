import { describe, expect, it } from "vitest";
import { hasBearerAuthorization, isSameOriginRequest } from "./sameOrigin";

describe("isSameOriginRequest", () => {
  it("accepts a browser request marked as same-origin", () => {
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "same-origin" }))).toBe(true);
  });

  it("rejects a cross-site request even when Origin is spoofed to match", () => {
    const headers = new Headers({
      "sec-fetch-site": "cross-site",
      origin: "https://artikare.com",
      host: "artikare.com",
    });
    expect(isSameOriginRequest(headers)).toBe(false);
  });

  it("falls back to comparing Origin with the host when Sec-Fetch-Site is missing", () => {
    expect(isSameOriginRequest(new Headers({ origin: "https://artikare.com", host: "artikare.com" }))).toBe(true);
    expect(isSameOriginRequest(new Headers({ origin: "https://malo.example", host: "artikare.com" }))).toBe(false);
  });

  it("uses the forwarded host behind a proxy", () => {
    const headers = new Headers({
      origin: "https://artikare.com",
      host: "internal:3000",
      "x-forwarded-host": "artikare.com",
    });
    expect(isSameOriginRequest(headers)).toBe(true);
  });

  it("rejects requests without any origin signal or with a malformed Origin", () => {
    expect(isSameOriginRequest(new Headers({ host: "artikare.com" }))).toBe(false);
    expect(isSameOriginRequest(new Headers({ origin: "null", host: "artikare.com" }))).toBe(false);
  });
});


describe("hasBearerAuthorization", () => {
  it("acepta solo un Bearer con token", () => {
    expect(hasBearerAuthorization(new Headers({ authorization: "Bearer abc.def.ghi" }))).toBe(true);
    expect(hasBearerAuthorization(new Headers({ authorization: "Basic abc" }))).toBe(false);
    expect(hasBearerAuthorization(new Headers({ authorization: "Bearer " }))).toBe(false);
    expect(hasBearerAuthorization(new Headers())).toBe(false);
  });
});
