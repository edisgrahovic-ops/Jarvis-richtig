import express from "express";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tools, runTool, dueReminders } from "./tools.js";

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
- Antworten sind präzise und werden oft vorgelesen: formuliere natürlich, klar und nicht unnötig lang.

Aktionen:
- Du hast Werkzeuge, um WIRKLICH etwas zu tun: Wetter abrufen, im Web suchen, Notizen/Erinnerungen speichern und lesen, Timer stellen und rechnen.
- Nutze diese Werkzeuge aktiv, statt zu sagen dass du etwas nicht kannst. Wenn eine Aufgabe ein Werkzeug braucht, rufe es auf.
- Bei mehrdeutigen Aufträgen triff sinnvolle Annahmen und handle. Bestätige ausgeführte Aktionen kurz.
- Fehlt dir ein Werkzeug für eine Aufgabe, sag ehrlich was du stattdessen tun kannst.`;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, configured: Boolean(API_KEY) });
});

// Fällige Erinnerungen abholen (das Handy pollt hier und meldet sie).
app.get("/api/reminders/due", (_req, res) => {
  res.json({ due: dueReminders() });
});

async function callClaude(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
      tools,
      messages,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Claude-API Fehler (${res.status}): ${t}`);
  }
  return res.json();
}

// Chat mit agentischer Tool-Schleife.
// Antwort: { text, actions } - actions werden im Browser ausgeführt (z. B. Timer).
app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: "Kein ANTHROPIC_API_KEY konfiguriert. Siehe .env.example.",
    });
  }
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-20)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  if (messages.length === 0) {
    return res.status(400).json({ error: "Keine Nachricht erhalten." });
  }

  const actions = [];
  try {
    for (let step = 0; step < 6; step++) {
      const data = await callClaude(messages);
      messages.push({ role: "assistant", content: data.content });

      if (data.stop_reason === "tool_use") {
        const toolResults = [];
        for (const block of data.content) {
          if (block.type !== "tool_use") continue;
          const result = await runTool(block.name, block.input || {});
          if (result.action) actions.push(result.action);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result.content ?? "OK",
          });
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return res.json({ text: text || "…", actions });
    }
    res.json({ text: "Ich habe zu viele Schritte gebraucht - bitte formuliere die Aufgabe etwas einfacher.", actions });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`\n  J.A.R.V.I.S. online  ->  http://localhost:${PORT}`);
  if (!API_KEY) {
    console.log("  ⚠  Kein ANTHROPIC_API_KEY gesetzt - siehe .env.example.");
  }
});
