// ============================================================================
//  PRODUKT ANLEGEN (inkl. der 8 Varianten aus Farbe × Größe)
// ----------------------------------------------------------------------------
//  Ablauf (so empfiehlt es Shopify für die GraphQL Admin API):
//    1. productCreate  – legt das Produkt + eine erste Standard-Variante an
//                        (automatisch: erste Farbe + erste Größe).
//    2. productVariantsBulkUpdate – setzt Preis/SKU dieser Standard-Variante.
//    3. productVariantsBulkCreate – fügt die restlichen Varianten hinzu.
// ============================================================================

import { graphql, pruefeUserErrors } from "./shopify.js";
import { produkt } from "../content/inhalte.js";

// Baut eine SKU-Nummer, z. B. "STOWE-BPH-GRAU-M".
function baueSku(farbe, groesse) {
  // Umlaute/Sonderzeichen aus der Farbe entfernen, alles in Großbuchstaben.
  const sauber = (text) =>
    text
      .toUpperCase()
      .replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/ß/g, "SS")
      .replace(/[^A-Z0-9]/g, "");
  return `${produkt.skuPraefix}-${sauber(farbe)}-${sauber(groesse)}`;
}

// Erzeugt alle 8 Kombinationen aus Farben × Größen.
function alleVarianten() {
  const liste = [];
  for (const farbe of produkt.optionen.farben) {
    for (const groesse of produkt.optionen.groessen) {
      liste.push({ farbe, groesse });
    }
  }
  return liste;
}

// Legt das Produkt an und gibt seine ID + Handle zurück.
// media = optionale Bild-Angaben (siehe medien.js); darf leer sein.
export async function legeProduktAn(config, media = []) {
  console.log("📦 Lege Produkt an:", produkt.titel);

  // --- Schritt 1: Produkt mit seinen Optionen erstellen -------------------
  const produktEingabe = {
    title: produkt.titel,
    descriptionHtml: produkt.beschreibungHtml,
    vendor: produkt.marke,
    productType: produkt.produktTyp,
    tags: produkt.tags,
    status: "DRAFT", // Produkt startet als Entwurf – noch nicht öffentlich sichtbar.
    productOptions: [
      {
        name: "Farbe",
        values: produkt.optionen.farben.map((wert) => ({ name: wert })),
      },
      {
        name: "Größe",
        values: produkt.optionen.groessen.map((wert) => ({ name: wert })),
      },
    ],
  };

  const createQuery = `
    mutation ProduktErstellen($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          handle
          variants(first: 1) {
            nodes { id }
          }
        }
        userErrors { field message }
      }
    }`;

  const createData = await graphql(
    createQuery,
    { product: produktEingabe, media },
    config
  );
  pruefeUserErrors("Produkt anlegen", createData.productCreate.userErrors);

  const angelegtesProdukt = createData.productCreate.product;
  const produktId = angelegtesProdukt.id;
  const standardVarianteId = angelegtesProdukt.variants.nodes[0]?.id;

  console.log("   ✓ Produkt erstellt (als Entwurf).");

  // --- Schritt 2: Die automatisch erzeugte Standard-Variante anpassen -----
  // Sie entspricht der ERSTEN Farbe + ERSTEN Größe (hier: Grau / S).
  const ersteFarbe = produkt.optionen.farben[0];
  const ersteGroesse = produkt.optionen.groessen[0];

  if (standardVarianteId) {
    const updateQuery = `
      mutation StandardVarianteAnpassen($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }`;
    const updateData = await graphql(
      updateQuery,
      {
        productId: produktId,
        variants: [
          {
            id: standardVarianteId,
            price: produkt.preis,
            inventoryItem: {
              sku: baueSku(ersteFarbe, ersteGroesse),
              tracked: produkt.lagerbestandVerfolgen,
            },
          },
        ],
      },
      config
    );
    pruefeUserErrors(
      "Standard-Variante anpassen",
      updateData.productVariantsBulkUpdate.userErrors
    );
  }

  // --- Schritt 3: Alle restlichen Varianten hinzufügen --------------------
  // Alle Kombinationen AUSSER der bereits vorhandenen Standard-Variante.
  const restlicheVarianten = alleVarianten().filter(
    (v) => !(v.farbe === ersteFarbe && v.groesse === ersteGroesse)
  );

  if (restlicheVarianten.length > 0) {
    const bulkQuery = `
      mutation VariantenHinzufuegen($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          productVariants { id }
          userErrors { field message }
        }
      }`;

    const varEingaben = restlicheVarianten.map((v) => ({
      price: produkt.preis,
      optionValues: [
        { optionName: "Farbe", name: v.farbe },
        { optionName: "Größe", name: v.groesse },
      ],
      inventoryItem: {
        sku: baueSku(v.farbe, v.groesse),
        tracked: produkt.lagerbestandVerfolgen,
      },
    }));

    const bulkData = await graphql(
      bulkQuery,
      { productId: produktId, variants: varEingaben },
      config
    );
    pruefeUserErrors(
      "Varianten hinzufügen",
      bulkData.productVariantsBulkCreate.userErrors
    );
  }

  const gesamt = alleVarianten().length;
  console.log(`   ✓ ${gesamt} Varianten angelegt (Preis je ${produkt.preis} €).`);

  return { produktId, handle: angelegtesProdukt.handle };
}
