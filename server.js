import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Minimaler .env-Loader (ohne externe Abhängigkeit) ---
(function loadEnv() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const PORT = process.env.PORT || 3000;
const MODEL = process.env.JARVIS_MODEL || "claude-opus-4-8";
const API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Du bist J.A.R.V.I.S. (Just A Rather Very Intelligent System), der persönliche KI-Assistent im Stil von Tony Starks Jarvis aus Iron Man.

Persönlichkeit:
- Du sprichst Deutsch, es sei denn der Nutzer schreibt in einer anderen Sprache.
- Höflich, souverän, leicht britisch-trocken im Humor, extrem kompetent.
- Du sprichst den Nutzer respektvoll an (gerne "Sir" oder mit Namen, wenn bekannt).
- Antworten sind präzise und hilfreich, nicht unnötig lang. Da deine Antworten oft vorgelesen werden, formuliere natürlich und klar.

Aufgaben:
- Du hilfst bei Fragen, Planung, Ideen, Erklärungen, Rechnen, Programmierung und allem Weiteren.
- Wenn du eine Aufgabe nicht real ausführen kannst (z.B. Smart-Home schalten), sag ehrlich, was du tun würdest, und wie es umgesetzt werden könnte.
- Sei proaktiv: schlage sinnvolle nächste Schritte vor.`;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, configured: Boolean(API_KEY) });
});

// Chat-Endpoint mit Streaming (Server-Sent Events)
app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error:
        "Kein ANTHROPIC_API_KEY konfiguriert. Lege eine .env-Datei an (siehe .env.example).",
    });
  }

  const history = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-20)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  if (messages.length === 0) {
    return res.status(400).json({ error: "Keine Nachricht erhalten." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        stream: true,
        messages,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      send("error", { message: `Claude-API Fehler (${upstream.status}): ${errText}` });
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const dataLine = part.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const payload = dataLine.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (
            evt.type === "content_block_delta" &&
            evt.delta?.type === "text_delta"
          ) {
            send("delta", { text: evt.delta.text });
          }
        } catch {
          /* ignore keep-alive/parse noise */
        }
      }
    }
    send("done", {});
    res.end();
  } catch (err) {
    send("error", { message: String(err?.message || err) });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n  J.A.R.V.I.S. online  ->  http://localhost:${PORT}`);
  if (!API_KEY) {
    console.log("  ⚠  Kein ANTHROPIC_API_KEY gesetzt - lege eine .env-Datei an (siehe .env.example).");
  }
});
