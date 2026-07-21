// ============================================================================
//  STOWE STUDIO – AUTOMATISCHE SHOP-EINRICHTUNG
// ----------------------------------------------------------------------------
//  Das ist die Startdatei. Sie ruft nacheinander alle Schritte auf:
//    1. Verbindung herstellen (.env prüfen)
//    2. Produkt "Backpack Hoodie" anlegen (als Entwurf)
//    3. Bilder aus ./images hochladen und zuordnen
//    4. Inhalts-Seiten anlegen (Startseite, Über uns, FAQ, Kontakt)
//    5. Rechtstext-Platzhalter anlegen (als Entwurf, mit Warnhinweis)
//    6. Navigations-Vorschlag ausgeben
//
//  Starten mit:   npm run setup      (oder:  node index.js )
//  Du kannst es gefahrlos mehrfach starten – vorhandene Seiten werden
//  übersprungen.
// ============================================================================

import "dotenv/config"; // liest automatisch die .env-Datei ein
import { ladeKonfiguration, stoppMit } from "./src/shopify.js";
import { legeProduktAn } from "./src/produkt.js";
import { ladeBilderHoch } from "./src/medien.js";
import { legeInhaltsSeitenAn, legeRechtsSeitenAn } from "./src/seiten.js";
import { zeigeNavigationsVorschlag } from "./src/navigation.js";

async function main() {
  console.log("\n🚀 Stowe Studio – Shop-Einrichtung startet ...\n");

  // Schritt 1: Zugangsdaten laden und prüfen.
  const config = ladeKonfiguration();
  console.log(`🔌 Verbinde mit Shop: ${config.shop} (API ${config.version})\n`);

  // Schritt 2: Produkt anlegen.
  const { produktId } = await legeProduktAn(config);

  // Schritt 3: Bilder hochladen (wird übersprungen, falls keine da sind).
  await ladeBilderHoch(config, produktId);

  // Schritt 4 + 5: Seiten anlegen.
  console.log("");
  await legeInhaltsSeitenAn(config);
  console.log("");
  await legeRechtsSeitenAn(config);

  // Schritt 6: Navigations-Vorschlag ausgeben.
  zeigeNavigationsVorschlag();

  console.log("✅ Fertig! Dein Shop ist vorbereitet.\n");
  console.log("👉 Nächste Schritte für dich:");
  console.log("   1. Prüfe das Produkt im Shopify-Admin und veröffentliche es, wenn es passt.");
  console.log("   2. ERSETZE die Rechtstext-Platzhalter durch echte, geprüfte Texte.");
  console.log("   3. Lege die Menüs gemäß dem Vorschlag oben an.");
  console.log("   4. Lege deine Bilder in ./images ab und starte das Skript erneut (falls noch nicht geschehen).\n");
}

// Startet das Skript und fängt alle unerwarteten Fehler sauber ab,
// damit du immer eine verständliche Meldung bekommst.
main().catch((fehler) => {
  stoppMit(fehler.message || String(fehler));
});
