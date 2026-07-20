// shopify.js
// -----------------------------------------------------------------------------
// Sichere, NUR-LESENDE Anbindung an die Shopify Admin API.
// Jarvis darf hiermit Produkte, Bestellungen und Umsatzzahlen ABFRAGEN und
// daraus Vorschlaege machen. Er aendert von sich aus NICHTS an eurem Shop.
//
// Damit das funktioniert, braucht ihr in der .env-Datei:
//   SHOPIFY_STORE   = eurladen.myshopify.com
//   SHOPIFY_TOKEN   = shpat_xxxxxxxxxxxxxxxxxxxxxxxx   (Admin API Access Token)
//
// Anleitung zum Token siehe README.md.
// -----------------------------------------------------------------------------

const API_VERSION = "2024-10";

function shopifyConfigured() {
  return Boolean(process.env.SHOPIFY_STORE && process.env.SHOPIFY_TOKEN);
}

// Kleiner Helfer: ruft die Shopify Admin API auf und gibt JSON zurueck.
async function shopifyRequest(path, params = {}) {
  if (!shopifyConfigured()) {
    return {
      _error:
        "Shopify ist noch nicht verbunden. Bitte SHOPIFY_STORE und SHOPIFY_TOKEN in der .env-Datei eintragen (Anleitung: README.md).",
    };
  }

  const store = process.env.SHOPIFY_STORE.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const url = new URL(`https://${store}/admin/api/${API_VERSION}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        _error: `Shopify-Anfrage fehlgeschlagen (HTTP ${res.status}). Antwort: ${body.slice(0, 300)}`,
      };
    }
    return await res.json();
  } catch (err) {
    return { _error: `Netzwerkfehler bei der Shopify-Anfrage: ${err.message}` };
  }
}

// -----------------------------------------------------------------------------
// Die einzelnen Faehigkeiten, die Jarvis nutzen darf (alle nur lesend).
// -----------------------------------------------------------------------------

async function getProducts({ limit = 20 } = {}) {
  const data = await shopifyRequest("products.json", {
    limit: Math.min(limit, 50),
    fields: "id,title,status,variants,vendor,product_type,tags",
  });
  if (data._error) return data;

  const products = (data.products || []).map((p) => ({
    id: p.id,
    titel: p.title,
    status: p.status,
    typ: p.product_type,
    anbieter: p.vendor,
    preise: (p.variants || []).map((v) => ({
      variante: v.title,
      preis: v.price,
      lagerbestand: v.inventory_quantity,
      sku: v.sku,
    })),
  }));
  return { anzahl: products.length, produkte: products };
}

async function getOrders({ limit = 20, status = "any" } = {}) {
  const data = await shopifyRequest("orders.json", {
    limit: Math.min(limit, 50),
    status,
    fields: "id,name,created_at,total_price,currency,financial_status,fulfillment_status,line_items",
  });
  if (data._error) return data;

  const orders = (data.orders || []).map((o) => ({
    bestellung: o.name,
    datum: o.created_at,
    summe: o.total_price,
    waehrung: o.currency,
    bezahlstatus: o.financial_status,
    versandstatus: o.fulfillment_status,
    artikel: (o.line_items || []).map((li) => ({
      titel: li.title,
      menge: li.quantity,
      preis: li.price,
    })),
  }));
  return { anzahl: orders.length, bestellungen: orders };
}

async function getShopStats() {
  const shopData = await shopifyRequest("shop.json", {
    fields: "name,email,currency,domain,plan_name",
  });
  if (shopData._error) return shopData;

  // Umsatz der letzten 30 Tage grob zusammenrechnen.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ordersData = await shopifyRequest("orders.json", {
    limit: 50,
    status: "any",
    created_at_min: since,
    fields: "total_price,financial_status,created_at",
  });

  let umsatz30Tage = 0;
  let bezahlteBestellungen = 0;
  if (!ordersData._error) {
    for (const o of ordersData.orders || []) {
      if (o.financial_status === "paid") {
        umsatz30Tage += parseFloat(o.total_price || "0");
        bezahlteBestellungen += 1;
      }
    }
  }

  return {
    shop: shopData.shop?.name,
    domain: shopData.shop?.domain,
    tarif: shopData.shop?.plan_name,
    waehrung: shopData.shop?.currency,
    umsatz_letzte_30_tage: umsatz30Tage.toFixed(2),
    bezahlte_bestellungen_30_tage: bezahlteBestellungen,
    hinweis:
      "Zahlen basieren auf max. 50 aktuellen Bestellungen der letzten 30 Tage (Naeherungswert).",
  };
}

// -----------------------------------------------------------------------------
// Tool-Definitionen fuer Claude + Dispatcher, der den passenden Aufruf ausfuehrt.
// -----------------------------------------------------------------------------

const shopifyTools = [
  {
    name: "shopify_produkte_lesen",
    description:
      "Liest die Produkte aus dem Shopify-Shop (Titel, Status, Preise, Lagerbestand). Nur lesend. Nutze das, wenn der Nutzer nach Produkten, Preisen, Sortiment oder Lager fragt.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Anzahl der Produkte (max 50)" },
      },
    },
  },
  {
    name: "shopify_bestellungen_lesen",
    description:
      "Liest aktuelle Bestellungen aus Shopify (Summe, Status, Artikel). Nur lesend. Nutze das bei Fragen zu Bestellungen, Kunden-Kaeufen oder Verkaeufen.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Anzahl der Bestellungen (max 50)" },
        status: {
          type: "string",
          enum: ["any", "open", "closed", "cancelled"],
          description: "Bestellstatus-Filter",
        },
      },
    },
  },
  {
    name: "shopify_shop_statistik",
    description:
      "Gibt eine Uebersicht ueber den Shop: Name, Tarif, Waehrung und geschaetzten Umsatz der letzten 30 Tage. Nur lesend. Nutze das bei Fragen zu Umsatz, Geschaeftslage oder Kennzahlen.",
    input_schema: { type: "object", properties: {} },
  },
];

async function runShopifyTool(name, input = {}) {
  switch (name) {
    case "shopify_produkte_lesen":
      return getProducts(input);
    case "shopify_bestellungen_lesen":
      return getOrders(input);
    case "shopify_shop_statistik":
      return getShopStats();
    default:
      return { _error: `Unbekanntes Tool: ${name}` };
  }
}

export { shopifyTools, runShopifyTool, shopifyConfigured };
