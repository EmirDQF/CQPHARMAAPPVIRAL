import { describe, expect, it } from "vitest";
import { javaHomeCandidates, parseAdbDevices, pickDevice, readSdkDir } from "./androidTooling";

describe("parseAdbDevices", () => {
  it("groups serials by state and ignores the header and daemon noise", () => {
    const output = [
      "* daemon started successfully",
      "List of devices attached",
      "RFCTB0PFLWB\tdevice",
      "emulator-5554\toffline",
      "ABC123\tunauthorized",
      "",
    ].join("\r\n");
    expect(parseAdbDevices(output)).toEqual({
      ready: ["RFCTB0PFLWB"],
      unauthorized: ["ABC123"],
      offline: ["emulator-5554"],
    });
  });

  it("ignores serials with shell metacharacters (they end up in a cmd.exe line on Windows)", () => {
    const output = ["List of devices attached", "X&calc.exe&\tdevice", "emulator-5554\tdevice", ""].join("\n");
    expect(parseAdbDevices(output).ready).toEqual(["emulator-5554"]);
  });
});

describe("pickDevice", () => {
  const devices = { ready: ["A", "B"], unauthorized: [], offline: [] };

  it("uses ANDROID_SERIAL when it is ready, otherwise the first ready device", () => {
    expect(pickDevice(devices, "B")).toEqual({ serial: "B" });
    expect(pickDevice(devices, undefined)).toEqual({ serial: "A" });
  });

  it("explains why there is no usable device", () => {
    expect(pickDevice({ ready: [], unauthorized: ["X"], offline: [] }, undefined)).toEqual({
      error: expect.stringMatching(/autoriza/),
    });
    expect(pickDevice({ ready: [], unauthorized: [], offline: [] }, undefined)).toEqual({
      error: expect.stringMatching(/Conecta/),
    });
    expect(pickDevice(devices, "Z")).toEqual({ error: expect.stringMatching(/ANDROID_SERIAL/) });
  });
});

describe("readSdkDir", () => {
  it("prefers ANDROID_HOME, then ANDROID_SDK_ROOT, then local.properties", () => {
    expect(readSdkDir({ ANDROID_HOME: "C:/sdk" }, null)).toBe("C:/sdk");
    expect(readSdkDir({ ANDROID_SDK_ROOT: "/opt/sdk" }, null)).toBe("/opt/sdk");
    expect(readSdkDir({}, "sdk.dir=C\\:\\\\Users\\\\dev\\\\Sdk\n")).toBe("C:\\Users\\dev\\Sdk");
    expect(readSdkDir({}, null)).toBeNull();
  });
});

describe("javaHomeCandidates", () => {
  it("puts JAVA_HOME first and adds the Android Studio JBR per platform", () => {
    expect(javaHomeCandidates({ JAVA_HOME: "/jdk" }, "linux")[0]).toBe("/jdk");
    expect(javaHomeCandidates({}, "win32")).toContain("C:\\Program Files\\Android\\Android Studio\\jbr");
    expect(javaHomeCandidates({}, "darwin")).toContain("/Applications/Android Studio.app/Contents/jbr/Contents/Home");
  });
});
