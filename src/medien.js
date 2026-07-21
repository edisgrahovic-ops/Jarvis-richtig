// ============================================================================
//  PRODUKTBILDER HOCHLADEN UND ZUORDNEN
// ----------------------------------------------------------------------------
//  Ablauf laut Shopify GraphQL Admin API:
//    1. Bilder im Ordner ./images finden.
//    2. stagedUploadsCreate  – Shopify gibt uns pro Bild eine Upload-Adresse.
//    3. Datei an diese Adresse hochladen.
//    4. productCreateMedia   – das hochgeladene Bild dem Produkt zuordnen.
//
//  WICHTIG: Liegt kein Bild im Ordner, wird dieser Schritt einfach
//  übersprungen – das Skript läuft trotzdem sauber durch.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { graphql, pruefeUserErrors } from "./shopify.js";

// Ordner, in dem deine Bilder liegen (Projektordner/images).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BILDER_ORDNER = path.join(__dirname, "..", "images");

// Welche Bild-Endungen wir akzeptieren und ihr passender "MIME-Typ".
const ERLAUBTE_TYPEN = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Sucht alle gültigen Bilddateien im Ordner ./images.
function findeBilder() {
  if (!fs.existsSync(BILDER_ORDNER)) return [];
  return fs
    .readdirSync(BILDER_ORDNER)
    .filter((name) => ERLAUBTE_TYPEN[path.extname(name).toLowerCase()])
    .sort() // sorgt für eine vorhersehbare Reihenfolge (bild-1, bild-2, ...)
    .map((name) => path.join(BILDER_ORDNER, name));
}

// Hauptfunktion: lädt alle Bilder hoch und ordnet sie dem Produkt zu.
export async function ladeBilderHoch(config, produktId) {
  const bilder = findeBilder();

  if (bilder.length === 0) {
    console.log(
      "🖼️  Keine Bilder im Ordner ./images gefunden – Schritt übersprungen.\n" +
        "     (Du kannst Bilder später einfach dort ablegen und das Skript erneut starten.)"
    );
    return;
  }

  console.log(`🖼️  ${bilder.length} Bild(er) gefunden – lade hoch ...`);

  // --- Schritt 1: Für jedes Bild eine Upload-Adresse anfordern ------------
  const uploadEingaben = bilder.map((dateipfad) => {
    const dateiname = path.basename(dateipfad);
    return {
      filename: dateiname,
      mimeType: ERLAUBTE_TYPEN[path.extname(dateiname).toLowerCase()],
      resource: "IMAGE",
      httpMethod: "POST",
      fileSize: String(fs.statSync(dateipfad).size),
    };
  });

  const stagedQuery = `
    mutation UploadAdressen($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`;

  const stagedData = await graphql(stagedQuery, { input: uploadEingaben }, config);
  pruefeUserErrors("Upload-Adressen anfordern", stagedData.stagedUploadsCreate.userErrors);

  const ziele = stagedData.stagedUploadsCreate.stagedTargets;

  // --- Schritt 2+3: Jede Datei an ihre Adresse hochladen ------------------
  const medienEingaben = [];
  for (let i = 0; i < bilder.length; i++) {
    const dateipfad = bilder[i];
    const dateiname = path.basename(dateipfad);
    const ziel = ziele[i];

    // Shopify erwartet ein Formular: erst die vorgegebenen Parameter,
    // dann als letztes die eigentliche Datei ("file").
    const formular = new FormData();
    for (const p of ziel.parameters) formular.append(p.name, p.value);
    const inhalt = fs.readFileSync(dateipfad);
    formular.append("file", new Blob([inhalt]), dateiname);

    const uploadAntwort = await fetch(ziel.url, { method: "POST", body: formular });
    if (!uploadAntwort.ok) {
      const text = await uploadAntwort.text().catch(() => "");
      throw new Error(
        `Bild "${dateiname}" konnte nicht hochgeladen werden ` +
          `(HTTP ${uploadAntwort.status}).\n   ${text.slice(0, 300)}`
      );
    }

    console.log(`   ✓ hochgeladen: ${dateiname}`);

    // Für die spätere Zuordnung merken wir uns die Referenz-URL.
    medienEingaben.push({
      originalSource: ziel.resourceUrl,
      mediaContentType: "IMAGE",
      alt: "Stowe Studio Backpack Hoodie",
    });
  }

  // --- Schritt 4: Alle Bilder dem Produkt zuordnen ------------------------
  const mediaQuery = `
    mutation BilderZuordnen($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { alt status }
        mediaUserErrors { field message }
      }
    }`;

  const mediaData = await graphql(
    mediaQuery,
    { productId: produktId, media: medienEingaben },
    config
  );
  pruefeUserErrors("Bilder zuordnen", mediaData.productCreateMedia.mediaUserErrors);

  console.log(`   ✓ ${medienEingaben.length} Bild(er) dem Produkt zugeordnet.`);
}
