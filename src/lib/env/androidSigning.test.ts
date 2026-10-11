import { describe, expect, it } from "vitest";
import { findMissingSigningSettings, parseProperties } from "./androidSigning";

const exists = () => true;

describe("parseProperties", () => {
  it("reads key=value lines and ignores comments and blanks", () => {
    expect(parseProperties("# firma\nstoreFile=../artikare.jks\n\nkeyAlias = subida\r\n")).toEqual({
      storeFile: "../artikare.jks",
      keyAlias: "subida",
    });
  });
});

describe("findMissingSigningSettings", () => {
  it("is ready with a complete keystore.properties", () => {
    const properties = { storeFile: "a.jks", storePassword: "x", keyAlias: "y", keyPassword: "z" };
    expect(findMissingSigningSettings(properties, {}, exists)).toEqual([]);
  });

  it("also accepts the values from environment variables", () => {
    const env = {
      ANDROID_KEYSTORE_PATH: "a.jks",
      ANDROID_KEYSTORE_PASSWORD: "x",
      ANDROID_KEY_ALIAS: "y",
      ANDROID_KEY_PASSWORD: "z",
    };
    expect(findMissingSigningSettings({}, env, exists)).toEqual([]);
  });

  it("names what is missing without a keystore, instead of creating one", () => {
    expect(findMissingSigningSettings({}, {}, exists)).toEqual([
      "storeFile (o ANDROID_KEYSTORE_PATH)",
      "storePassword (o ANDROID_KEYSTORE_PASSWORD)",
      "keyAlias (o ANDROID_KEY_ALIAS)",
      "keyPassword (o ANDROID_KEY_PASSWORD)",
    ]);
  });

  it("fails when the keystore file does not exist and never echoes secrets", () => {
    const properties = { storeFile: "falta.jks", storePassword: "secreto-123", keyAlias: "y", keyPassword: "otro-secreto" };
    const missing = findMissingSigningSettings(properties, {}, () => false);

    expect(missing).toEqual(["storeFile: el archivo del keystore no existe"]);
    expect(missing.join(" ")).not.toMatch(/secreto/);
  });
});
