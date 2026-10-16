import { expect, test, type Page } from "@playwright/test";

/**
 * Auditoría de interactividad (375 px): ningún elemento interactivo muerto.
 * - Todo control visible tiene nombre accesible.
 * - Ningún enlace a "#", vacío o javascript:, y los internos responden < 400.
 * - Deshabilitado = con motivo visible enlazado por aria-describedby.
 * - Cada botón habilitado produce un efecto real al tocarlo (cambio en la
 *   página, navegación, diálogo, compartir, imprimir o ventana nueva).
 * - Foco visible al tabular. Inventario: docs/BUTTON-AUDIT.md.
 */
const ROUTES = ["/", "/acceso", "/citas", "/blog", "/privacidad", "/app", "/app/ajustes", "/app/reporte-medico"] as const;
/** Pestañas de /app que no se ven al cargar: se abren antes de auditar sus controles. */
const APP_TABS = ["Mi salud", "Aprender", "Jugar", "Médico"] as const;

interface View {
  route: string;
  tab?: string;
}

const VIEWS: View[] = [...ROUTES.map((route) => ({ route })), ...APP_TABS.map((tab) => ({ route: "/app", tab }))];

async function openView(page: Page, { route, tab }: View): Promise<void> {
  await page.goto(route, { waitUntil: "networkidle" });
  if (!tab) return;
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("button", { name: tab }).click();
  await page.waitForTimeout(EFFECT_WAIT_MS);
}
const INTERACTIVE = "a[href], button, [role='button'], input:not([type='hidden']), select, textarea, summary";
const EFFECT_WAIT_MS = 600;
const TAB_STOPS_CHECKED = 15;

interface ControlInfo {
  index: number;
  tag: string;
  name: string;
  href: string | null;
  disabled: boolean;
  reason: string;
  isButton: boolean;
  /** Conmutador ya activo (aria-pressed/selected/current): volver a tocarlo no cambia nada, y está bien. */
  isActiveToggle: boolean;
}

/** Cuenta efectos que no siempre cambian el DOM (imprimir, compartir, abrir ventana). */
async function instrument(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __effects: number };
    w.__effects = 0;
    const bump = () => {
      w.__effects += 1;
    };
    window.print = bump;
    window.open = (() => {
      bump();
      return null;
    }) as typeof window.open;
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => bump() });
    document.addEventListener("DOMContentLoaded", () => {
      new MutationObserver(bump).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    });
  });
}

async function listControls(page: Page): Promise<ControlInfo[]> {
  return page.locator(INTERACTIVE).evaluateAll((elements) =>
    elements.flatMap((element, index) => {
      const el = element as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && !el.closest("[aria-hidden='true'], [inert]");
      if (!isVisible || el.classList.contains("sr-only")) return [];
      const byIds = (ids: string | null) =>
        (ids ?? "")
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
          .join(" ")
          .trim();
      const input = el as HTMLInputElement;
      const labelText = input.labels ? [...input.labels].map((label) => label.textContent ?? "").join(" ") : "";
      const name = (el.getAttribute("aria-label") ?? byIds(el.getAttribute("aria-labelledby")) ?? "") || labelText || el.textContent || el.getAttribute("title") || el.getAttribute("alt") || input.placeholder || "";
      const disabled = (el as HTMLButtonElement).disabled === true || el.getAttribute("aria-disabled") === "true";
      const tag = el.tagName.toLowerCase();
      const isButton = tag === "button" || el.getAttribute("role") === "button";
      const isActiveToggle = ["aria-pressed", "aria-selected", "aria-current"].some((attr) => ["true", "page"].includes(el.getAttribute(attr) ?? ""));
      return [{ index, tag, name: name.trim(), href: el.getAttribute("href"), disabled, reason: byIds(el.getAttribute("aria-describedby")), isButton, isActiveToggle }];
    })
  );
}

async function hadEffect(page: Page, control: ControlInfo, route: string): Promise<boolean> {
  const before = page.url();
  const popup = page.context().waitForEvent("page", { timeout: EFFECT_WAIT_MS }).then(() => true, () => false);
  const dialog = page.waitForEvent("dialog", { timeout: EFFECT_WAIT_MS }).then(async (d) => (await d.dismiss(), true), () => false);
  await page.evaluate(() => ((window as unknown as { __effects: number }).__effects = 0));
  // Handle fijo: tras el clic la vista puede cambiar y `nth()` apuntaría a otro elemento (o a ninguno).
  const target = await page.locator(INTERACTIVE).nth(control.index).elementHandle({ timeout: 3000 });
  if (!target) return false;
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await target.click({ timeout: 3000 });
  await page.waitForTimeout(EFFECT_WAIT_MS);
  // Desplazar a una sección o mover el foco a otro control también es un efecto real (p. ej. "Registrar" → chequeo).
  const movedFocus = await target.evaluate((el) => document.activeElement !== null && document.activeElement !== document.body && document.activeElement !== el).catch(() => true);
  const scrolled = await page.evaluate((before) => window.scrollY !== before, scrollBefore).catch(() => true);
  const mutations = await page.evaluate(() => (window as unknown as { __effects?: number }).__effects ?? 1).catch(() => 1);
  await target.dispose();
  const navigated = page.url() !== before || !page.url().endsWith(route);
  return navigated || mutations > 0 || movedFocus || scrolled || (await popup) || (await dialog);
}

for (const view of VIEWS) {
  const route = view.tab ? `${view.route} › ${view.tab}` : view.route;
  test(`${route}: sin elementos interactivos muertos`, async ({ page, request }) => {
    test.setTimeout(300_000);
    await instrument(page);
    await openView(page, view);
    const controls = await listControls(page);
    expect(controls.length).toBeGreaterThan(0);

    for (const control of controls) {
      expect(control.name, `${route} · ${control.tag}#${control.index} sin nombre accesible`).not.toBe("");
      if (control.href !== null) {
        expect(control.href, `${route} · "${control.name}" con href muerto`).not.toMatch(/^(#|javascript:|)$/);
      }
      if (control.disabled) expect(control.reason, `${route} · "${control.name}" deshabilitado sin motivo visible`).not.toBe("");
    }

    const internalLinks = [...new Set(controls.flatMap((control) => (control.href?.startsWith("/") ? [control.href.split("#")[0]] : [])))];
    for (const href of internalLinks) {
      expect((await request.get(href)).status(), `${route} → ${href}`).toBeLessThan(400);
    }

    const isClickable = (control: ControlInfo) => control.isButton && !control.disabled && !control.isActiveToggle;
    const buttons = controls.filter(isClickable);
    for (const [position, button] of buttons.entries()) {
      // Cada botón en una página recién cargada; se ubica por nombre y ocurrencia (la posición cambia al hidratar).
      const occurrence = buttons.slice(0, position).filter((other) => other.name === button.name).length;
      await openView(page, view);
      const fresh = (await listControls(page)).filter((control) => isClickable(control) && control.name === button.name)[occurrence];
      if (!fresh) continue;
      expect(await hadEffect(page, fresh, view.route), `${route} · botón "${button.name}" no hace nada`).toBe(true);
    }
  });
}

test("/app: el foco es visible al tabular", async ({ page }) => {
  await page.goto("/app", { waitUntil: "networkidle" });
  for (let stop = 0; stop < TAB_STOPS_CHECKED; stop += 1) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return { name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName, outline: style.outlineStyle, shadow: style.boxShadow };
    });
    if (!focus) continue;
    expect(focus.outline !== "none" || focus.shadow !== "none", `foco invisible en "${focus.name}"`).toBe(true);
  }
});
