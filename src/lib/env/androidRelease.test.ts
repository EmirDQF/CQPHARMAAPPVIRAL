import { describe, expect, it } from "vitest";
import { findGeneratedConfigIssues, findReleaseSourceIssues } from "./androidRelease";

const STRICT_CONFIG = `<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
</network-security-config>`;
const MANIFEST = `<manifest><application android:networkSecurityConfig="@xml/network_security_config"></application></manifest>`;

describe("findReleaseSourceIssues", () => {
  it("accepts a strict main manifest and network config", () => {
    expect(findReleaseSourceIssues({ manifest: MANIFEST, xmlFiles: { "network_security_config.xml": STRICT_CONFIG } })).toEqual([]);
  });

  it("flags usesCleartextTraffic in the main manifest", () => {
    const manifest = MANIFEST.replace("<application", '<application android:usesCleartextTraffic="true"');
    expect(findReleaseSourceIssues({ manifest, xmlFiles: { "network_security_config.xml": STRICT_CONFIG } })).toEqual([
      "AndroidManifest.xml (main) declara usesCleartextTraffic",
    ]);
  });

  it("flags any cleartext exception in main xml resources", () => {
    const config = STRICT_CONFIG.replace("</network", '<domain-config cleartextTrafficPermitted="true"/></network');
    expect(findReleaseSourceIssues({ manifest: MANIFEST, xmlFiles: { "network_security_config.xml": config } })).toEqual([
      "network_security_config.xml (main) permite cleartext",
    ]);
  });

  it("requires the strict network config to be wired and to deny cleartext", () => {
    const manifest = "<manifest><application></application></manifest>";
    expect(findReleaseSourceIssues({ manifest, xmlFiles: {} })).toEqual([
      "AndroidManifest.xml (main) no referencia @xml/network_security_config",
      "network_security_config.xml (main) no existe o no niega cleartext en base-config",
    ]);
  });
});

describe("findGeneratedConfigIssues", () => {
  const releaseJson = JSON.stringify({ server: { url: "https://app.ejemplo.pe/", cleartext: false } });

  it("accepts a release capacitor.config.json", () => {
    expect(findGeneratedConfigIssues({ capacitorConfigJson: releaseJson, pluginsManifest: "<manifest/>" })).toEqual([]);
  });

  it("accepts a bundled config (no remote server) and flags mixed content in it", () => {
    const bundled = JSON.stringify({
      appId: "com.artikare.app",
      webDir: "out-mobile",
      server: { androidScheme: "https" },
      android: { allowMixedContent: false },
    });
    expect(findGeneratedConfigIssues({ capacitorConfigJson: bundled, pluginsManifest: "<manifest/>" })).toEqual([]);
    const mixed = JSON.stringify({ webDir: "out-mobile", android: { allowMixedContent: true } });
    expect(findGeneratedConfigIssues({ capacitorConfigJson: mixed, pluginsManifest: "<manifest/>" })).toEqual([
      "capacitor.config.json: allowMixedContent activado",
    ]);
    const insecure = JSON.stringify({ server: { androidScheme: "http", cleartext: true } });
    expect(findGeneratedConfigIssues({ capacitorConfigJson: insecure, pluginsManifest: "<manifest/>" })).toEqual([
      "capacitor.config.json: cleartext activado",
      "capacitor.config.json: androidScheme no es https",
    ]);
  });

  it("flags a dev config left in the assets", () => {
    const devJson = JSON.stringify({ server: { url: "http://localhost:3000/", cleartext: true } });
    expect(findGeneratedConfigIssues({ capacitorConfigJson: devJson, pluginsManifest: "<manifest/>" })).toEqual([
      "capacitor.config.json: server.url no es https",
      "capacitor.config.json: contiene localhost o un host local",
      "capacitor.config.json: cleartext activado",
    ]);
  });

  it("flags a missing or unparseable config and cleartext in the plugins manifest", () => {
    const manifest = '<application android:usesCleartextTraffic="true">';
    expect(findGeneratedConfigIssues({ capacitorConfigJson: null, pluginsManifest: manifest })).toEqual([
      "capacitor.config.json: no existe o no es JSON válido (ejecuta cap sync)",
      "capacitor-cordova-android-plugins: AndroidManifest.xml declara usesCleartextTraffic",
    ]);
    expect(findGeneratedConfigIssues({ capacitorConfigJson: "{", pluginsManifest: null })[0]).toMatch(/JSON/);
  });
});
