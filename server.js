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
app.use(express.json({ limit: "12mb" })); // groesser, damit Bild-Uploads reinpassen
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
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b"; // versteht Bilder
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ACTIVE_MODEL = PROVIDER === "groq" ? GROQ_MODEL : PROVIDER === "gemini" ? GEMINI_MODEL : "demo";

// -----------------------------------------------------------------------------
// Jarvis' Persoenlichkeit & Auftrag (System-Prompt)
// -----------------------------------------------------------------------------
const SYSTEM_PROMPT = `Du bist "Jarvis" – der legendaere KI-Assistent aus Iron Man, nun im Dienst von
Edis und seinem Freund fuer den Aufbau ihres Dropshipping-Online-Business.

Deine Persoenlichkeit (SEHR WICHTIG, halte sie konsequent durch):
- Du bist maennlich, kultiviert und loyal – im Stil eines hochintelligenten britischen Butlers.
- Du sprichst den Nutzer stets mit "Sir" an (z.B. am Anfang oder Ende einer Antwort, nicht in jedem Satz).
- Du hast einen trockenen, feinen Sarkasmus und unterschwelligen Humor – elegante Seitenhiebe, nie plump,
  nie beleidigend, nie auf Kosten deiner Hilfsbereitschaft. Ein Hauch Ironie, dann volle Kompetenz.
- Trotz aller Spitzfindigkeit bist du absolut professionell und lieferst IMMER echten, konkreten Mehrwert.
  Du bist der zuverlaessige Partner im Hintergrund, der alles im Griff hat und leise mitdenkt.
- Du antwortest auf Deutsch (ausser der Nutzer wechselt die Sprache), in kurzen, gepflegten Absaetzen.

Ton-Beispiele (nachahmen, nicht woertlich kopieren):
- "Sehr wohl, Sir. Ich habe mir erlaubt, drei Nischen herauszusuchen – Dankbarkeit nehme ich spaeter entgegen."
- "Eine bemerkenswerte Idee, Sir. Riskant, aber genau deshalb koennte sie funktionieren."
- "Selbstverstaendlich, Sir. Ich waere ja ein schlechter Assistent, wuerde ich Sie da hineinrennen lassen."

Womit du hilfst:
- Produktrecherche & Nischenfindung, Lieferanten (z.B. AliExpress, CJ Dropshipping), Marketing (TikTok, Meta Ads),
  Shop-Optimierung, Preisgestaltung, Kundenservice, rechtliche Basics (Impressum, Widerruf – aber verweise fuer
  Rechtssicherheit immer an einen Anwalt/Steuerberater).
- Halte den Inhalt fokussiert und umsetzbar: konkrete naechste Schritte statt langer Theorie. Der Humor wuerzt,
  ersetzt aber nie die Substanz.

Shopify:
- Du kannst den echten Shopify-Shop AUSLESEN (Produkte, Bestellungen, Umsatz) – ABER NUR, wenn dir dafuer
  Funktionen (Tools) zur Verfuegung stehen.
- Rufe eine Shopify-Funktion NUR auf, wenn der Nutzer ausdruecklich nach den EIGENEN Shop-Daten fragt
  (z.B. "unser Umsatz", "unsere Produkte", "unsere Bestellungen").
- Bei ALLGEMEINEN Fragen (Nischen, Produktideen, Marketing, Trends, Konkurrenz, Preisstrategien, How-to)
  antworte DIREKT aus deinem Wissen. Rufe dafuer KEINE Shopify-Funktion auf und verlange keinen Shop-Zugriff.
- Wenn keine Shopify-Funktionen verfuegbar sind, erwaehne Shopify gar nicht, sondern beantworte die Frage normal.
- WICHTIG: Du aenderst NICHTS von selbst. Du liest, analysierst und SCHLAEGST VOR.

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

  // Shopify-Funktionen nur anbieten, wenn der Shop verbunden ist.
  const payload = { model: GROQ_MODEL };
  if (shopifyConfigured()) {
    payload.tools = groqTools;
    payload.tool_choice = "auto";
  }

  for (let step = 0; step < 6; step++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ ...payload, messages: convo }),
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

// Denk-Bloecke mancher Modelle (<think>...</think>) aus der Antwort entfernen.
function stripThink(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "")
    .trim();
}

// Einfacher Groq-Aufruf (ohne Tool-Schleife) fuer Vision & Recherche.
// Kein reasoning_format (nicht alle Modelle unterstuetzen es) – wir entfernen
// etwaige <think>-Bloecke selbst mit stripThink().
async function groqComplete(model, convo, { maxTokens = 2048 } = {}) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages: convo, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq HTTP ${res.status} (${model}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return stripThink(data.choices?.[0]?.message?.content || "");
}

// GEHIRN (Bild): Screenshot/Foto analysieren.
async function chatWithGroqVision(messages, imageDataUrl) {
  const prior = messages.slice(0, -1).map((m) => ({ role: m.role, content: String(m.content ?? "") }));
  const last = messages[messages.length - 1] || { content: "" };
  const frage =
    String(last.content ?? "").trim() ||
    "Analysiere dieses Bild und sag mir, was es fuer mein Dropshipping-Business bedeutet.";

  const convo = [
    { role: "system", content: SYSTEM_PROMPT },
    ...prior,
    {
      role: "user",
      content: [
        { type: "text", text: frage },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];
  const reply = await groqComplete(GROQ_VISION_MODEL, convo, { maxTokens: 2048 });
  return { reply: reply || "(keine Antwort)", toolsUsed: ["bild_analyse"] };
}

// Echte Web-Suche via Tavily (gratis, optional). Gibt getrimmte Ergebnisse
// zurueck oder null, wenn kein Schluessel gesetzt ist bzw. die Suche scheitert.
async function webSearchTavily(query) {
  if (!process.env.TAVILY_API_KEY) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        search_depth: "basic",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lines = (data.results || []).map((r) => `- ${r.title}: ${r.content}`).join("\n");
    return lines.slice(0, 4000) || null;
  } catch (_) {
    return null;
  }
}

// GEHIRN (Recherche): echte Web-Suche (wenn Tavily-Schluessel da), sonst
// fundierte Antwort aus dem Wissen. Nutzt das schnelle Standardmodell.
async function chatWithGroqResearch(messages) {
  const last = messages[messages.length - 1] || { content: "" };
  const query = String(last.content ?? "");
  const results = await webSearchTavily(query);

  const persona =
    "Du bist Jarvis: hoeflich, trocken-sarkastisch, professionell, nennst den Nutzer 'Sir'. " +
    "Du hilfst bei einem Dropshipping-Business. Antworte kompakt mit konkreten Beispielen und naechsten Schritten.";

  let sys, userContent, mark;
  if (results) {
    sys = persona + " Stuetze dich auf die folgenden AKTUELLEN Web-Suchergebnisse und nenne konkrete Beispiele/Quellen.";
    userContent = `Frage: ${query}\n\nAktuelle Web-Suchergebnisse:\n${results}`;
    mark = "web_recherche";
  } else {
    sys =
      persona +
      " Hinweis: Es ist gerade keine Live-Websuche aktiv. Antworte fundiert aus deinem Wissen und weise am Ende " +
      "mit einem Satz darauf hin, dass fuer topaktuelle Daten eine Websuche aktiviert werden kann.";
    userContent = query;
    mark = "recherche_wissen";
  }

  const convo = [
    { role: "system", content: sys },
    { role: "user", content: userContent },
  ];
  const reply = await groqComplete(GROQ_MODEL, convo, { maxTokens: 1024 });
  return { reply: reply || "(keine Antwort)", toolsUsed: [mark] };
}

// -----------------------------------------------------------------------------
// GEHIRN 2: Google Gemini – mit Retry + Modell-Fallback + Zeitlimit
// -----------------------------------------------------------------------------
async function callGemini(contents) {
  const body = { systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents };
  if (shopifyConfigured()) body.tools = geminiTools;
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

// GEHIRN 2 (Bild): Bildanalyse mit Gemini (inline_data).
async function chatWithGeminiVision(messages, imageDataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(imageDataUrl || "");
  if (!m) return { reply: "Ich konnte das Bild nicht lesen, Sir.", toolsUsed: [] };
  const prior = messages.slice(0, -1).map((x) => ({
    role: x.role === "assistant" ? "model" : "user",
    parts: [{ text: String(x.content ?? "") }],
  }));
  const last = messages[messages.length - 1] || { content: "" };
  const frage =
    String(last.content ?? "").trim() ||
    "Analysiere dieses Bild und sag mir, was es fuer mein Dropshipping-Business bedeutet.";

  const contents = [
    ...prior,
    { role: "user", parts: [{ text: frage }, { inline_data: { mime_type: m[1], data: m[2] } }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents }),
  });
  if (!res.ok) throw new Error(`Gemini Vision HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("\n").trim();
  return { reply: text || "(keine Antwort)", toolsUsed: ["bild_analyse"] };
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
  const { messages, image, research } = req.body || {};
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
    let result;
    if (image) {
      // Bild analysieren (aktuell ueber Groq-Vision).
      if (PROVIDER === "groq") {
        result = await chatWithGroqVision(messages, image);
      } else {
        result = await chatWithGeminiVision(messages, image);
      }
    } else if (research && PROVIDER === "groq") {
      // Echte Web-Recherche.
      result = await chatWithGroqResearch(messages);
    } else {
      result = PROVIDER === "groq" ? await chatWithGroq(messages) : await chatWithGemini(messages);
    }
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
