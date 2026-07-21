// ============================================================================
//  VERBINDUNG ZU SHOPIFY (GraphQL Admin API)
// ----------------------------------------------------------------------------
//  Diese Datei kümmert sich um das "Telefonieren" mit Shopify. Der Rest des
//  Projekts benutzt nur die Funktion graphql(...) und muss sich um die
//  technischen Details nicht kümmern.
// ============================================================================

// Liest die Zugangsdaten aus der .env-Datei ein und prüft sie.
// Bei einem Problem wird das Skript mit einer klaren Meldung gestoppt.
export function ladeKonfiguration() {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || "2025-07";

  const fehlend = [];
  if (!shop) fehlend.push("SHOPIFY_SHOP_DOMAIN");
  if (!token) fehlend.push("SHOPIFY_ACCESS_TOKEN");

  if (fehlend.length > 0) {
    stoppMit(
      `Es fehlen Angaben in deiner .env-Datei: ${fehlend.join(", ")}.\n` +
        `   ➜ Lege eine Datei ".env" an (Vorlage: .env.example) und trage die Werte ein.`
    );
  }

  // Häufiger Fehler: die schöne Domain statt der .myshopify.com-Adresse.
  if (!shop.endsWith(".myshopify.com")) {
    console.warn(
      `⚠️  Hinweis: SHOPIFY_SHOP_DOMAIN sollte auf ".myshopify.com" enden ` +
        `(z. B. stowe-studio.myshopify.com), nicht deine Domain stowestudio.de.\n` +
        `   Aktuell eingetragen: "${shop}". Ich versuche es trotzdem.`
    );
  }

  return { shop, token, version };
}

// Baut die vollständige API-Adresse zusammen.
function endpunkt(shop, version) {
  return `https://${shop}/admin/api/${version}/graphql.json`;
}

// Die zentrale Funktion, um eine GraphQL-Anfrage (Query oder Mutation) zu senden.
//   query     = der GraphQL-Text
//   variables = die dynamischen Werte dazu
//   config    = das Ergebnis von ladeKonfiguration()
// Gibt bei Erfolg das "data"-Objekt zurück. Bei Fehlern wird eine
// verständliche Fehlermeldung geworfen.
export async function graphql(query, variables, config) {
  let antwort;
  try {
    antwort = await fetch(endpunkt(config.shop, config.version), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": config.token,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (netzfehler) {
    // Kein Internet, falsche Shop-Adresse, o. Ä.
    throw new Error(
      `Ich konnte Shopify nicht erreichen. Prüfe deine Internetverbindung und ` +
        `ob SHOPIFY_SHOP_DOMAIN ("${config.shop}") korrekt ist.\n` +
        `   Technische Meldung: ${netzfehler.message}`
    );
  }

  // Typische HTTP-Fehler in Klartext übersetzen.
  if (antwort.status === 401 || antwort.status === 403) {
    throw new Error(
      `Zugriff verweigert (HTTP ${antwort.status}). Das bedeutet meistens:\n` +
        `   • Der Access Token (SHOPIFY_ACCESS_TOKEN) ist falsch oder abgelaufen, ODER\n` +
        `   • deiner App fehlen die nötigen Berechtigungen (Scopes):\n` +
        `     write_products, write_content, write_files.\n` +
        `   ➜ Prüfe den Token und die Scopes im Shopify-Adminbereich (siehe README.md).`
    );
  }
  if (antwort.status === 404) {
    throw new Error(
      `Shopify-Adresse nicht gefunden (HTTP 404). Ist SHOPIFY_SHOP_DOMAIN ` +
        `("${config.shop}") wirklich deine ".myshopify.com"-Adresse?`
    );
  }
  if (!antwort.ok) {
    const text = await antwort.text().catch(() => "");
    throw new Error(
      `Shopify hat mit Fehler HTTP ${antwort.status} geantwortet.\n   ${text.slice(0, 500)}`
    );
  }

  const ergebnis = await antwort.json();

  // GraphQL kann trotz HTTP 200 Fehler im Body melden (z. B. Tippfehler in der Query).
  if (ergebnis.errors) {
    const meldungen = ergebnis.errors.map((e) => `• ${e.message}`).join("\n   ");
    throw new Error(`Shopify hat die Anfrage abgelehnt:\n   ${meldungen}`);
  }

  return ergebnis.data;
}

// Kleiner Helfer: Viele Shopify-Mutationen liefern "userErrors" zurück –
// fachliche Fehler (z. B. "Titel fehlt"). Diese Funktion wirft daraus eine
// klare Fehlermeldung, falls etwas schiefging.
export function pruefeUserErrors(bereich, userErrors) {
  if (userErrors && userErrors.length > 0) {
    const meldungen = userErrors
      .map((e) => `• ${e.field ? e.field.join(".") + ": " : ""}${e.message}`)
      .join("\n   ");
    throw new Error(`Problem bei "${bereich}":\n   ${meldungen}`);
  }
}

// Bricht das Skript mit einer freundlichen, klaren Meldung ab.
export function stoppMit(nachricht) {
  console.error(`\n❌ ${nachricht}\n`);
  process.exit(1);
}
