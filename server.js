import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { dueReminders } from "./tools.js";
import * as gemini from "./providers/gemini.js";
import * as anthropic from "./providers/anthropic.js";

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

// --- Anbieter-Auswahl: gemini (kostenlos) oder anthropic ---
const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const PROVIDERS = {
  gemini: { mod: gemini, keyEnv: "GEMINI_API_KEY", defaultModel: "gemini-2.0-flash" },
  anthropic: { mod: anthropic, keyEnv: "ANTHROPIC_API_KEY", defaultModel: "claude-opus-4-8" },
};
const active = PROVIDERS[PROVIDER] || PROVIDERS.gemini;
const API_KEY = process.env[active.keyEnv];
const MODEL = process.env.JARVIS_MODEL || active.defaultModel;

const SYSTEM_PROMPT = `Du bist J.A.R.V.I.S. (Just A Rather Very Intelligent System), der persönliche KI-Assistent im Stil von Tony Starks Jarvis aus Iron Man.

Persönlichkeit:
- Du sprichst Deutsch, es sei denn der Nutzer schreibt in einer anderen Sprache.
- Höflich, souverän, leicht britisch-trocken im Humor, extrem kompetent.
- Du sprichst den Nutzer respektvoll an (gerne "Sir" oder mit Namen, wenn bekannt).
- Antworten sind präzise und werden oft vorgelesen: formuliere natürlich, klar und nicht unnötig lang.

Aktionen:
- Du hast Werkzeuge, um WIRKLICH etwas zu tun: Wetter abrufen, Notizen/Erinnerungen speichern und lesen, Timer stellen und rechnen.
- Nutze diese Werkzeuge aktiv, statt zu sagen dass du etwas nicht kannst. Wenn eine Aufgabe ein Werkzeug braucht, rufe es auf.
- Bei mehrdeutigen Aufträgen triff sinnvolle Annahmen und handle. Bestätige ausgeführte Aktionen kurz.
- Fehlt dir ein Werkzeug für eine Aufgabe, sag ehrlich was du stattdessen tun kannst.`;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: PROVIDER, model: MODEL, configured: Boolean(API_KEY) });
});

// Fällige Erinnerungen abholen (das Handy pollt hier und meldet sie).
app.get("/api/reminders/due", (_req, res) => {
  res.json({ due: dueReminders() });
});

app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: `Kein ${active.keyEnv} konfiguriert. Siehe .env.example.`,
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

  try {
    const { text, actions } = await active.mod.chat({
      messages,
      model: MODEL,
      apiKey: API_KEY,
      system: SYSTEM_PROMPT,
    });
    res.json({ text, actions });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`\n  J.A.R.V.I.S. online (${PROVIDER}, ${MODEL})  ->  http://localhost:${PORT}`);
  if (!API_KEY) {
    console.log(`  ⚠  Kein ${active.keyEnv} gesetzt - siehe .env.example.`);
  }
});
