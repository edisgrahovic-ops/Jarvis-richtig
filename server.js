// server.js
// -----------------------------------------------------------------------------
// Jarvis-Backend: verbindet das Browser-Interface mit Google Gemini (dem
// "Gehirn") und den Shopify-Tools. Laeuft als kleiner Express-Server.
//
// Gemini hat ein kostenloses Kontingent – perfekt zum Starten.
// Schluessel eintragen in .env:  GEMINI_API_KEY=...
// (Anleitung: README.md)
// -----------------------------------------------------------------------------

import "dotenv/config";
import express from "express";
import { runShopifyTool, shopifyConfigured } from "./shopify.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Gratis & schnell. "gemini-flash-latest" zeigt immer aufs aktuelle Flash-Modell.
// Alternativen bei Problemen: "gemini-2.0-flash".
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

// Demo-Modus, falls noch kein Schluessel gesetzt ist (Jarvis stuerzt nicht ab).
const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

// -----------------------------------------------------------------------------
// Jarvis' Persoenlichkeit & Auftrag (System-Prompt)
// -----------------------------------------------------------------------------
const SYSTEM_PROMPT = `Du bist "Jarvis", ein hochkompetenter KI-Assistent im Stil von Iron Man –
aber spezialisiert auf den Aufbau eines Dropshipping-Online-Business.

Wer du bist:
- Du hilfst zwei Gruendern (Edis und seinem Freund), ein profitables Dropshipping-Business aufzubauen.
- Du bist praezise, motivierend, ehrlich und praxisnah. Du redest wie ein loyaler, cleverer Partner – locker, aber kompetent.
- Du antwortest auf Deutsch, ausser der Nutzer schreibt in einer anderen Sprache.
- Halte Antworten fokussiert und umsetzbar. Nenne konkrete naechste Schritte statt langer Theorie.

Womit du hilfst:
- Produktrecherche & Nischenfindung, Lieferanten (z.B. AliExpress, CJ Dropshipping), Marketing (TikTok, Meta Ads),
  Shop-Optimierung, Preisgestaltung, Kundenservice, rechtliche Basics (Impressum, Widerruf – aber verweise fuer
  Rechtssicherheit immer an einen Anwalt/Steuerberater).

Shopify:
- Du kannst den echten Shopify-Shop AUSLESEN (Produkte, Bestellungen, Umsatz) ueber deine Funktionen (Tools).
- WICHTIG: Du aenderst NICHTS von selbst. Du liest, analysierst und SCHLAEGST VOR.
  Wenn du eine Aenderung empfiehlst (z.B. Preis anpassen, Produkt anlegen), erklaere sie und sage dem Nutzer,
  wie er sie in Shopify umsetzt oder bitte um seine Bestaetigung.
- Nutze deine Funktionen proaktiv, wenn eine Frage sich mit echten Shop-Daten besser beantworten laesst.

Stil: Kurze Absaetze, ruhig auch mal eine passende Emoji, aber uebertreib es nicht. Sei der "Jarvis", dem man vertraut.`;

// -----------------------------------------------------------------------------
// Shopify-Funktionen im Gemini-Format (nur lesend).
// Die Namen passen zum Dispatcher runShopifyTool() in shopify.js.
// -----------------------------------------------------------------------------
const geminiTools = [
  {
    functionDeclarations: [
      {
        name: "shopify_produkte_lesen",
        description:
          "Liest Produkte aus dem Shopify-Shop (Titel, Status, Preise, Lagerbestand). Nur lesend.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Anzahl der Produkte (max 50)" },
          },
        },
      },
      {
        name: "shopify_bestellungen_lesen",
        description:
          "Liest aktuelle Bestellungen aus Shopify (Summe, Status, Artikel). Nur lesend.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Anzahl der Bestellungen (max 50)" },
            status: {
              type: "STRING",
              enum: ["any", "open", "closed", "cancelled"],
              description: "Bestellstatus-Filter",
            },
          },
        },
      },
      {
        name: "shopify_shop_statistik",
        description:
          "Uebersicht ueber den Shop: Name, Tarif, Waehrung und geschaetzter Umsatz der letzten 30 Tage. Nur lesend.",
        // keine Parameter noetig
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Ein Aufruf an die Gemini-API.
// -----------------------------------------------------------------------------
async function callGemini(contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    tools: geminiTools,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json();
}

// -----------------------------------------------------------------------------
// Chat-Endpunkt: nimmt den Gespraechsverlauf, laesst Gemini ggf. Shopify-Tools
// nutzen, und gibt die finale Antwort zurueck.
// -----------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Feld 'messages' (Array) fehlt." });
  }

  if (!hasApiKey) {
    return res.json({
      reply:
        "Hi, ich bin Jarvis im Demo-Modus. 🤖 Sobald ihr einen kostenlosen Gemini-API-Schluessel in die .env-Datei eintragt (GEMINI_API_KEY), denke ich richtig mit und helfe euch beim Dropshipping-Business. Anleitung steht in der README!",
      toolsUsed: [],
      demo: true,
    });
  }

  // Unseren Verlauf ({role,content}) ins Gemini-Format ({role,parts}) umwandeln.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "") }],
  }));

  const toolsUsed = [];

  try {
    // Agentische Schleife: Gemini darf mehrfach Funktionen aufrufen.
    for (let step = 0; step < 6; step++) {
      const data = await callGemini(contents);
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      const functionCalls = parts.filter((p) => p.functionCall);

      if (functionCalls.length > 0) {
        // Gemini's Funktionsaufruf-Turn merken ...
        contents.push({ role: "model", parts });

        // ... und die Ergebnisse zuruecksenden.
        const responseParts = [];
        for (const p of functionCalls) {
          const name = p.functionCall.name;
          const args = p.functionCall.args || {};
          toolsUsed.push(name);
          const result = await runShopifyTool(name, args);
          responseParts.push({
            functionResponse: { name, response: result },
          });
        }
        contents.push({ role: "user", parts: responseParts });
        continue; // naechste Runde: Gemini verarbeitet die Ergebnisse
      }

      // Fertig: Textantwort einsammeln.
      const text = parts
        .filter((p) => typeof p.text === "string")
        .map((p) => p.text)
        .join("\n")
        .trim();

      if (!text) {
        const reason = candidate?.finishReason || "unbekannt";
        return res.json({
          reply: `Ich konnte gerade keine Antwort erzeugen (Grund: ${reason}). Frag mich bitte nochmal etwas anders. 🙂`,
          toolsUsed,
        });
      }
      return res.json({ reply: text, toolsUsed });
    }

    return res.json({
      reply:
        "Ich habe mehrere Schritte gebraucht und breche hier ab, damit wir nicht in einer Schleife haengen. Frag mich gern nochmal konkreter. 🙂",
      toolsUsed,
    });
  } catch (err) {
    console.error("Fehler im Chat-Endpunkt:", err);
    return res.status(500).json({
      error: "Jarvis hatte gerade ein Problem beim Nachdenken.",
      detail: err.message,
    });
  }
});

// Status fuer das Frontend.
app.get("/api/status", (_req, res) => {
  res.json({
    modell: MODEL,
    kiVerbunden: hasApiKey,
    shopifyVerbunden: shopifyConfigured(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🤖 Jarvis laeuft auf http://localhost:${PORT}`);
  console.log(`   KI-Gehirn (Gemini): ${hasApiKey ? "verbunden ✅" : "Demo-Modus (kein Schluessel) ⚠️"}`);
  console.log(`   Shopify:            ${shopifyConfigured() ? "verbunden ✅" : "noch nicht verbunden ⚠️"}\n`);
});
