// ============================================================================
//  SHOPIFY-SEITEN ANLEGEN (Inhalts- und Rechtstext-Seiten)
// ----------------------------------------------------------------------------
//  Benutzt die Mutation pageCreate. Damit das Skript MEHRFACH ausführbar ist,
//  prüfen wir vorher, ob eine Seite mit demselben "handle" schon existiert –
//  und überspringen sie dann.
// ============================================================================

import { graphql, pruefeUserErrors } from "./shopify.js";
import {
  inhaltsSeiten,
  rechtsSeiten,
  rechtstextPlatzhalter,
} from "../content/inhalte.js";

// Prüft, ob es bereits eine Seite mit diesem handle gibt.
async function seiteExistiert(config, handle) {
  const query = `
    query SeiteSuchen($suche: String!) {
      pages(first: 1, query: $suche) {
        nodes { id handle }
      }
    }`;
  const data = await graphql(query, { suche: `handle:${handle}` }, config);
  return data.pages.nodes.some((n) => n.handle === handle);
}

// Legt eine einzelne Seite an – oder überspringt sie, falls schon vorhanden.
//   entwurf = true  ➜ Seite bleibt unveröffentlicht (Entwurf).
async function legeSeiteAn(config, { handle, titel, html }, entwurf) {
  if (await seiteExistiert(config, handle)) {
    console.log(`   ↷ übersprungen (existiert schon): ${titel}`);
    return;
  }

  const query = `
    mutation SeiteErstellen($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle title }
        userErrors { field message }
      }
    }`;

  const data = await graphql(
    query,
    {
      page: {
        title: titel,
        handle,
        body: html,
        isPublished: !entwurf, // false = Entwurf, true = sofort sichtbar
      },
    },
    config
  );
  pruefeUserErrors(`Seite "${titel}" anlegen`, data.pageCreate.userErrors);

  console.log(`   ✓ angelegt: ${titel}${entwurf ? " (Entwurf)" : ""}`);
}

// Legt alle Inhalts-Seiten an (Startseite, Über uns, FAQ, Kontakt).
// Diese werden direkt VERÖFFENTLICHT.
export async function legeInhaltsSeitenAn(config) {
  console.log("📄 Erstelle Inhalts-Seiten ...");
  for (const seite of inhaltsSeiten) {
    await legeSeiteAn(config, seite, /* entwurf */ false);
  }
}

// Legt alle Rechtstext-Platzhalter an – IMMER als ENTWURF und mit Warnhinweis.
export async function legeRechtsSeitenAn(config) {
  console.log("⚖️  Erstelle Rechtstext-Platzhalter (als Entwurf) ...");
  for (const { handle, titel, thema } of rechtsSeiten) {
    await legeSeiteAn(
      config,
      { handle, titel, html: rechtstextPlatzhalter(thema) },
      /* entwurf */ true
    );
  }
}
