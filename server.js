// server.js
// -----------------------------------------------------------------------------
// Jarvis-Backend: verbindet das Browser-Interface mit Claude (dem "Gehirn")
// und den Shopify-Tools. Laeuft als kleiner Express-Server.
// -----------------------------------------------------------------------------

import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { shopifyTools, runShopifyTool, shopifyConfigured } from "./shopify.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const MODEL = "claude-opus-4-8";

// Demo-Modus: wenn noch kein API-Schluessel gesetzt ist, antwortet Jarvis mit
// einer freundlichen Platzhalter-Nachricht, statt abzustuerzen.
const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
const client = hasApiKey ? new Anthropic() : null;

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
- Du kannst den echten Shopify-Shop AUSLESEN (Produkte, Bestellungen, Umsatz) ueber deine Tools.
- WICHTIG: Du aenderst NICHTS von selbst. Du liest, analysierst und SCHLAEGST VOR.
  Wenn du eine Aenderung empfiehlst (z.B. Preis anpassen, Produkt anlegen), erklaere sie und sage dem Nutzer,
  wie er sie in Shopify umsetzt oder bitte um seine Bestaetigung.
- Nutze deine Tools proaktiv, wenn eine Frage sich mit echten Shop-Daten besser beantworten laesst.

Stil: Kurze Absaetze, ruhig auch mal eine passende Emoji, aber uebertreib es nicht. Sei der "Jarvis", dem man vertraut.`;

// -----------------------------------------------------------------------------
// Chat-Endpunkt: nimmt den Gespraechsverlauf, laesst Claude ggf. Tools nutzen,
// und gibt die finale Antwort zurueck.
// -----------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Feld 'messages' (Array) fehlt." });
  }

  // Demo-Modus ohne echten Schluessel.
  if (!hasApiKey) {
    return res.json({
      reply:
        "Hi, ich bin Jarvis im Demo-Modus. 🤖 Sobald ihr einen Anthropic-API-Schluessel in die .env-Datei eintragt (ANTHROPIC_API_KEY), denke ich richtig mit und kann euch beim Dropshipping-Business helfen. Bis dahin: Fragt mich gern schon mal etwas, ich sage euch dann, was ich koennen werde!",
      toolsUsed: [],
      demo: true,
    });
  }

  const conversation = [...messages];
  const toolsUsed = [];

  try {
    // Agentische Schleife: Claude darf mehrfach Tools aufrufen, bis es fertig ist.
    for (let step = 0; step < 6; step++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        tools: shopifyTools,
        messages: conversation,
      });

      if (response.stop_reason === "tool_use") {
        conversation.push({ role: "assistant", content: response.content });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type === "tool_use") {
            toolsUsed.push(block.name);
            const result = await runShopifyTool(block.name, block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }
        conversation.push({ role: "user", content: toolResults });
        continue; // naechste Runde: Claude verarbeitet die Tool-Ergebnisse
      }

      // Fertig: finale Textantwort einsammeln.
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return res.json({ reply: text || "(keine Antwort)", toolsUsed });
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

// Status-Endpunkt fuer das Frontend (zeigt an, ob alles verbunden ist).
app.get("/api/status", (_req, res) => {
  res.json({
    modell: MODEL,
    kiVerbunden: hasApiKey,
    shopifyVerbunden: shopifyConfigured(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🤖 Jarvis laeuft auf http://localhost:${PORT}`);
  console.log(`   KI-Gehirn (Claude): ${hasApiKey ? "verbunden ✅" : "Demo-Modus (kein API-Schluessel) ⚠️"}`);
  console.log(`   Shopify:            ${shopifyConfigured() ? "verbunden ✅" : "noch nicht verbunden ⚠️"}\n`);
});
