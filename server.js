// server.js
// -----------------------------------------------------------------------------
// Jarvis-Backend: verbindet das Browser-Interface mit einem KI-"Gehirn" und den
// Shopify-Tools. Laeuft als kleiner Express-Server.
//
// Unterstuetzte Gehirne (Jarvis waehlt automatisch anhand des vorhandenen Schluessels):
//   1) Groq   – GRATIS, ohne Kreditkarte, sehr schnell  -> GROQ_API_KEY
//   2) Gemini – Google (Gratis nur in manchen Regionen) -> GEMINI_API_KEY
//   3) Demo   – ohne Schluessel (Platzhalter-Antworten)
//
// Schluessel eintragen in .env (Anleitung: README.md).
// -----------------------------------------------------------------------------

import "dotenv/config";
import express from "express";
import { runShopifyTool, shopifyConfigured } from "./shopify.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Welches Gehirn? Groq hat Vorrang (gratis & zuverlaessig), sonst Gemini.
const PROVIDER = process.env.GROQ_API_KEY
  ? "groq"
  : process.env.GEMINI_API_KEY
  ? "gemini"
  : "demo";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ACTIVE_MODEL = PROVIDER === "groq" ? GROQ_MODEL : PROVIDER === "gemini" ? GEMINI_MODEL : "demo";

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
// Shopify-Funktionen – einmal als OpenAI/Groq-Format, einmal als Gemini-Format.
// Beide zeigen auf denselben Dispatcher runShopifyTool() (nur lesend).
// -----------------------------------------------------------------------------
const TOOL_DEFS = [
  {
    name: "shopify_produkte_lesen",
    description: "Liest Produkte aus dem Shopify-Shop (Titel, Status, Preise, Lagerbestand). Nur lesend.",
    props: { limit: { type: "integer", description: "Anzahl der Produkte (max 50)" } },
    required: [],
  },
  {
    name: "shopify_bestellungen_lesen",
    description: "Liest aktuelle Bestellungen aus Shopify (Summe, Status, Artikel). Nur lesend.",
    props: {
      limit: { type: "integer", description: "Anzahl der Bestellungen (max 50)" },
      status: { type: "string", enum: ["any", "open", "closed", "cancelled"], description: "Bestellstatus-Filter" },
    },
    required: [],
  },
  {
    name: "shopify_shop_statistik",
    description: "Uebersicht ueber den Shop: Name, Tarif, Waehrung und geschaetzter Umsatz der letzten 30 Tage. Nur lesend.",
    props: {},
    required: [],
  },
];

// OpenAI/Groq-Format
const groqTools = TOOL_DEFS.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: { type: "object", properties: t.props, required: t.required },
  },
}));

// Gemini-Format (Typen in GROSSBUCHSTABEN)
function toGeminiType(t) {
  return { string: "STRING", integer: "INTEGER", number: "NUMBER", boolean: "BOOLEAN" }[t] || "STRING";
}
const geminiTools = [
  {
    functionDeclarations: TOOL_DEFS.map((t) => {
      const decl = { name: t.name, description: t.description };
      if (Object.keys(t.props).length > 0) {
        const properties = {};
        for (const [k, v] of Object.entries(t.props)) {
          properties[k] = { type: toGeminiType(v.type), description: v.description };
          if (v.enum) properties[k].enum = v.enum;
        }
        decl.parameters = { type: "OBJECT", properties };
      }
      return decl;
    }),
  },
];

// -----------------------------------------------------------------------------
// GEHIRN 1: Groq (OpenAI-kompatibel) – gratis & schnell
// -----------------------------------------------------------------------------
async function chatWithGroq(messages) {
  const convo = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: String(m.content ?? "") })),
  ];
  const toolsUsed = [];

  for (let step = 0; step < 6; step++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages: convo, tools: groqTools, tool_choice: "auto" }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;

    if (msg?.tool_calls?.length) {
      convo.push(msg); // Assistant-Turn mit tool_calls merken
      for (const tc of msg.tool_calls) {
        const name = tc.function?.name;
        let args = {};
        try {
          args = JSON.parse(tc.function?.arguments || "{}");
        } catch (_) {}
        toolsUsed.push(name);
        const result = await runShopifyTool(name, args);
        convo.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    return { reply: (msg?.content || "").trim() || "(keine Antwort)", toolsUsed };
  }
  return { reply: "Ich habe zu viele Schritte gebraucht und breche ab. Frag mich gern konkreter. 🙂", toolsUsed };
}

// -----------------------------------------------------------------------------
// GEHIRN 2: Google Gemini – mit Retry + Modell-Fallback + Zeitlimit
// -----------------------------------------------------------------------------
async function callGemini(contents) {
  const body = { systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents, tools: geminiTools };
  const models = [...new Set([GEMINI_MODEL, "gemini-2.0-flash"])];
  let lastError = "Unbekannter Fehler";
  let quotaProblem = false;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        lastError = `Zeitueberschreitung/Netzwerk (${model}): ${err.message}`;
        await sleep(700 * (attempt + 1));
        continue;
      }
      clearTimeout(timer);

      if (res.ok) return res.json();

      const text = await res.text();
      lastError = `Gemini HTTP ${res.status} (${model}): ${text.slice(0, 200)}`;
      if (res.status === 429) {
        quotaProblem = true;
        break;
      }
      if ([500, 503].includes(res.status)) {
        await sleep(700 * (attempt + 1));
        continue;
      }
      throw new Error(lastError);
    }
  }

  if (quotaProblem) {
    throw new Error(
      "QUOTA: Dein Gemini-Schluessel hat kein freies Kontingent (Fehler 429). Wechsel am besten auf Groq (gratis) – siehe README.",
    );
  }
  throw new Error(`Gemini ist gerade ueberlastet. Letzter Hinweis: ${lastError}`);
}

async function chatWithGemini(messages) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "") }],
  }));
  const toolsUsed = [];

  for (let step = 0; step < 6; step++) {
    const data = await callGemini(contents);
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length > 0) {
      contents.push({ role: "model", parts });
      const responseParts = [];
      for (const p of functionCalls) {
        const name = p.functionCall.name;
        const args = p.functionCall.args || {};
        toolsUsed.push(name);
        const result = await runShopifyTool(name, args);
        responseParts.push({ functionResponse: { name, response: result } });
      }
      contents.push({ role: "user", parts: responseParts });
      continue;
    }

    const text = parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("\n").trim();
    if (!text) {
      return { reply: `Ich konnte gerade keine Antwort erzeugen (Grund: ${candidate?.finishReason || "unbekannt"}). Frag mich nochmal. 🙂`, toolsUsed };
    }
    return { reply: text, toolsUsed };
  }
  return { reply: "Ich habe zu viele Schritte gebraucht und breche ab. Frag mich gern konkreter. 🙂", toolsUsed };
}

// -----------------------------------------------------------------------------
// Chat-Endpunkt
// -----------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Feld 'messages' (Array) fehlt." });
  }

  if (PROVIDER === "demo") {
    return res.json({
      reply:
        "Hi, ich bin Jarvis im Demo-Modus. 🤖 Sobald ihr einen kostenlosen Groq-Schluessel in die .env-Datei eintragt (GROQ_API_KEY), denke ich richtig mit. Anleitung steht in der README!",
      toolsUsed: [],
      demo: true,
    });
  }

  try {
    const result = PROVIDER === "groq" ? await chatWithGroq(messages) : await chatWithGemini(messages);
    return res.json(result);
  } catch (err) {
    console.error("Fehler im Chat-Endpunkt:", err);
    if (String(err.message).startsWith("QUOTA:")) {
      return res.json({
        reply:
          "🔑 Mein aktuelles KI-Gehirn hat gerade kein freies Kontingent. Am besten auf Groq (gratis, ohne Kreditkarte) wechseln – Anleitung in der README. 💪",
        toolsUsed: [],
      });
    }
    return res.status(500).json({ error: "Jarvis hatte gerade ein Problem beim Nachdenken.", detail: err.message });
  }
});

app.get("/api/status", (_req, res) => {
  res.json({
    provider: PROVIDER,
    modell: ACTIVE_MODEL,
    kiVerbunden: PROVIDER !== "demo",
    shopifyVerbunden: shopifyConfigured(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🤖 Jarvis laeuft auf http://localhost:${PORT}`);
  console.log(`   KI-Gehirn: ${PROVIDER === "demo" ? "Demo-Modus ⚠️" : PROVIDER + " (" + ACTIVE_MODEL + ") ✅"}`);
  console.log(`   Shopify:   ${shopifyConfigured() ? "verbunden ✅" : "noch nicht verbunden ⚠️"}\n`);
});
