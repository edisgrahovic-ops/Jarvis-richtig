// Adapter für Google Gemini (kostenloser Tarif via Google AI Studio).
import { toolSpecs, runTool } from "../tools.js";

const TYPE_MAP = {
  object: "OBJECT", string: "STRING", number: "NUMBER",
  integer: "INTEGER", boolean: "BOOLEAN", array: "ARRAY",
};

// Neutrales JSON-Schema -> Gemini-Schema (Typen groß, leere Objekte weglassen)
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== "object") return undefined;
  const out = { type: TYPE_MAP[schema.type] || "STRING" };
  if (schema.description) out.description = schema.description;
  if (schema.type === "object") {
    const props = schema.properties || {};
    const keys = Object.keys(props);
    if (keys.length === 0) return undefined; // Gemini mag keine leeren Objekte
    out.properties = {};
    for (const k of keys) out.properties[k] = toGeminiSchema(props[k]);
    if (schema.required?.length) out.required = schema.required;
  }
  return out;
}

const functionDeclarations = toolSpecs.map((t) => {
  const decl = { name: t.name, description: t.description };
  const params = toGeminiSchema(t.parameters);
  if (params) decl.parameters = params;
  return decl;
});

export async function chat({ messages, model, apiKey, system }) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents,
    tools: [{ function_declarations: functionDeclarations }],
  };

  const actions = [];

  for (let step = 0; step < 6; step++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Gemini-API Fehler (${res.status}): ${t}`);
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const parts = cand?.content?.parts || [];
    const calls = parts.filter((p) => p.functionCall);

    if (calls.length) {
      body.contents.push(cand.content); // Modell-Zug mit functionCall übernehmen
      const responseParts = [];
      for (const p of calls) {
        const result = await runTool(p.functionCall.name, p.functionCall.args || {});
        if (result.action) actions.push(result.action);
        responseParts.push({
          functionResponse: {
            name: p.functionCall.name,
            response: { result: result.content ?? "OK" },
          },
        });
      }
      body.contents.push({ role: "user", parts: responseParts });
      continue;
    }

    const text = parts.filter((p) => p.text).map((p) => p.text).join("").trim();
    return { text: text || "…", actions };
  }
  return { text: "Ich habe zu viele Schritte gebraucht - bitte formuliere die Aufgabe etwas einfacher.", actions };
}
