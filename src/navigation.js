// ============================================================================
//  NAVIGATIONS-VORSCHLAG AUSGEBEN
// ----------------------------------------------------------------------------
//  Menüs kann (und soll) man in Shopify bequem im Adminbereich einrichten
//  (unter "Onlineshop" ➜ "Menüs"). Dieses Skript legt die Menüs daher NICHT
//  automatisch an, sondern gibt dir am Ende einen fertigen Vorschlag aus,
//  den du 1:1 übernehmen kannst.
// ============================================================================

import { navigationsVorschlag } from "../content/inhalte.js";

export function zeigeNavigationsVorschlag() {
  const linie = "─".repeat(60);
  console.log(`\n${linie}`);
  console.log("🧭 VORSCHLAG FÜR DEINE NAVIGATION (bitte manuell in Shopify anlegen)");
  console.log(linie);
  console.log("So geht's: Shopify-Admin ➜ Onlineshop ➜ Menüs ➜ Menüpunkt hinzufügen.\n");

  console.log("HAUPTMENÜ (oben im Shop):");
  for (const punkt of navigationsVorschlag.hauptmenue) {
    console.log(`   • ${punkt.titel.padEnd(20)} ➜  ${punkt.ziel}`);
  }

  console.log("\nFUSSMENÜ (unten im Shop – meist die Rechtstexte):");
  for (const punkt of navigationsVorschlag.fussmenue) {
    console.log(`   • ${punkt.titel.padEnd(20)} ➜  ${punkt.ziel}`);
  }

  console.log(`${linie}\n`);
}
