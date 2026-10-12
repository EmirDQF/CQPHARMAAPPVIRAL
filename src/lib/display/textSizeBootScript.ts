import { TEXT_SIZE_STORAGE_KEY, TEXT_SIZE_VERSION, TEXT_SIZES } from "./textSize";

/**
 * Script en línea para `<head>`: pone `<html data-text-size>` antes de la
 * primera pintura, así la letra elegida no "salta" al hidratar. Es una cadena
 * fija generada desde constantes (sin datos del usuario), por eso admite un
 * hash CSP estable. Valida igual que `parseTextSize` y nunca lanza.
 */
export const TEXT_SIZE_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  TEXT_SIZE_STORAGE_KEY
)})||"null");if(p&&p.version===${TEXT_SIZE_VERSION}&&${JSON.stringify(
  TEXT_SIZES
)}.indexOf(p.size)>-1)document.documentElement.dataset.textSize=p.size}catch(e){}`;
