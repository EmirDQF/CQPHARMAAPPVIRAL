import { describe, expect, it } from "vitest";
import capacitorConfig from "../../../capacitor.config";
import { ANDROID_APP_ID } from "./appIdentity";

describe("app identity", () => {
  it("uses the same Android package name as capacitor.config.ts", () => {
    expect(capacitorConfig.appId).toBe(ANDROID_APP_ID);
  });
});
