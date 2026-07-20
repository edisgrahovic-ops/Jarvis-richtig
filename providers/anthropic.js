// Adapter für Anthropic Claude (kostenpflichtig, dafür mit echter Web-Suche).
import { toolSpecs, runTool } from "../tools.js";

const anthropicTools = [
  // Server-Werkzeug: echte Web-Suche (läuft auf Anthropic-Seite)
  { type: "web_search_20250305", name: "web_search", max_uses: 5 },
  ...toolSpecs.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  })),
];

export async function chat({ messages, model, apiKey, system }) {
  const convo = messages.map((m) => ({ role: m.role, content: String(m.content) }));
  const actions = [];

  for (let step = 0; step < 6; step++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: 1500, system, tools: anthropicTools, messages: convo }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Claude-API Fehler (${res.status}): ${t}`);
    }
    const data = await res.json();
    convo.push({ role: "assistant", content: data.content });

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
      convo.push({ role: "user", content: toolResults });
      continue;
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { text: text || "…", actions };
  }
  return { text: "Ich habe zu viele Schritte gebraucht - bitte formuliere die Aufgabe etwas einfacher.", actions };
}
