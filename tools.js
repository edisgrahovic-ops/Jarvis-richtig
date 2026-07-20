import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// --- kleine JSON-Persistenz ---
function load(file, fallback) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return fallback;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return fallback; }
}
function save(file, data) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2));
}
const nid = () => Math.random().toString(36).slice(2, 8);

// ================= Neutrale Werkzeug-Definitionen =================
// Anbieter-unabhängig; die Provider-Adapter wandeln das in ihr Format um.
export const toolSpecs = [
  {
    name: "get_weather",
    description: "Ruft das aktuelle Wetter und die Vorhersage für einen Ort ab.",
    parameters: {
      type: "object",
      properties: { location: { type: "string", description: "Ort/Stadt, z. B. 'Berlin'" } },
      required: ["location"],
    },
  },
  {
    name: "save_note",
    description: "Speichert eine Notiz oder einen To-Do-Eintrag dauerhaft.",
    parameters: {
      type: "object",
      properties: { text: { type: "string", description: "Inhalt der Notiz" } },
      required: ["text"],
    },
  },
  {
    name: "list_notes",
    description: "Listet alle gespeicherten Notizen/To-Dos auf.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "delete_note",
    description: "Löscht eine Notiz anhand ihrer ID (aus list_notes).",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "add_reminder",
    description:
      "Legt eine Erinnerung an, die zu einem Zeitpunkt fällig wird. Gib den Zeitpunkt als ISO-8601 an (z. B. 2026-07-20T18:30:00). Berechne den Zeitpunkt aus der Nutzerangabe relativ zur aktuellen Zeit.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Woran erinnert werden soll" },
        due: { type: "string", description: "Fälligkeit als ISO-8601-Zeitstempel" },
      },
      required: ["text", "due"],
    },
  },
  {
    name: "list_reminders",
    description: "Listet alle anstehenden Erinnerungen auf.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "set_timer",
    description: "Stellt einen Timer, der nach der angegebenen Dauer im Gerät klingelt.",
    parameters: {
      type: "object",
      properties: {
        seconds: { type: "number", description: "Dauer in Sekunden" },
        label: { type: "string", description: "Optionaler Name des Timers" },
      },
      required: ["seconds"],
    },
  },
  {
    name: "calculate",
    description: "Berechnet einen mathematischen Ausdruck (z. B. '3 * (4 + 2)' oder '15% von 240').",
    parameters: {
      type: "object",
      properties: { expression: { type: "string" } },
      required: ["expression"],
    },
  },
  {
    name: "get_current_time",
    description: "Gibt das aktuelle Datum und die Uhrzeit zurück.",
    parameters: { type: "object", properties: {} },
  },
];

// ================= Reminder-Zugriff für den Server (Polling) =================
export function dueReminders() {
  const now = Date.now();
  const all = load("reminders.json", []);
  const due = all.filter((r) => !r.fired && new Date(r.due).getTime() <= now);
  if (due.length) {
    for (const r of due) r.fired = true;
    save("reminders.json", all);
  }
  return due;
}

// ================= Wetter (Open-Meteo, kein API-Key nötig) =================
const WEATHER_CODES = {
  0: "klar", 1: "überwiegend klar", 2: "teilweise bewölkt", 3: "bedeckt",
  45: "Nebel", 48: "Reifnebel", 51: "leichter Nieselregen", 53: "Nieselregen",
  55: "starker Nieselregen", 61: "leichter Regen", 63: "Regen", 65: "starker Regen",
  71: "leichter Schneefall", 73: "Schneefall", 75: "starker Schneefall",
  80: "Regenschauer", 81: "Regenschauer", 82: "heftige Regenschauer",
  95: "Gewitter", 96: "Gewitter mit Hagel", 99: "schweres Gewitter mit Hagel",
};

async function getWeather(location) {
  const geoR = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`
  );
  const geo = await geoR.json();
  const place = geo?.results?.[0];
  if (!place) return `Ort "${location}" nicht gefunden.`;
  const wR = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
  );
  const w = await wR.json();
  const c = w.current;
  const cond = WEATHER_CODES[c.weather_code] || "unbekannt";
  const days = w.daily.time
    .map((d, i) => {
      const dc = WEATHER_CODES[w.daily.weather_code[i]] || "";
      return `${d}: ${Math.round(w.daily.temperature_2m_min[i])}–${Math.round(w.daily.temperature_2m_max[i])}°C, ${dc}`;
    })
    .join("\n");
  return `Wetter in ${place.name}${place.country ? ", " + place.country : ""}:
Aktuell: ${Math.round(c.temperature_2m)}°C (gefühlt ${Math.round(c.apparent_temperature)}°C), ${cond}, Wind ${Math.round(c.wind_speed_10m)} km/h.
Vorhersage:
${days}`;
}

// ================= sicheres Rechnen =================
function calculate(expr) {
  let e = String(expr).toLowerCase()
    .replace(/(\d+(?:[.,]\d+)?)\s*%\s*von\s*(\d+(?:[.,]\d+)?)/g, "($1/100)*$2")
    .replace(/,/g, ".")
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
  if (!/^[\d\s+\-*/().%*]+$/.test(e)) return "Ausdruck enthält ungültige Zeichen.";
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${e});`)();
    if (typeof val !== "number" || !isFinite(val)) return "Kein gültiges Ergebnis.";
    return `Ergebnis: ${Math.round(val * 1e6) / 1e6}`;
  } catch {
    return "Konnte den Ausdruck nicht berechnen.";
  }
}

// ================= Werkzeug-Ausführung =================
export async function runTool(name, input) {
  try {
    switch (name) {
      case "get_weather":
        return { content: await getWeather(input.location) };

      case "save_note": {
        const notes = load("notes.json", []);
        const note = { id: nid(), text: input.text, ts: new Date().toISOString() };
        notes.push(note);
        save("notes.json", notes);
        return { content: `Notiz gespeichert (ID ${note.id}).` };
      }
      case "list_notes": {
        const notes = load("notes.json", []);
        if (!notes.length) return { content: "Keine Notizen vorhanden." };
        return { content: notes.map((n) => `[${n.id}] ${n.text}`).join("\n") };
      }
      case "delete_note": {
        let notes = load("notes.json", []);
        const before = notes.length;
        notes = notes.filter((n) => n.id !== input.id);
        save("notes.json", notes);
        return { content: before === notes.length ? "Keine Notiz mit dieser ID." : "Notiz gelöscht." };
      }

      case "add_reminder": {
        const reminders = load("reminders.json", []);
        const when = new Date(input.due);
        if (isNaN(when.getTime())) return { content: "Ungültiger Zeitpunkt." };
        const r = { id: nid(), text: input.text, due: when.toISOString(), fired: false };
        reminders.push(r);
        save("reminders.json", reminders);
        return { content: `Erinnerung gesetzt für ${when.toLocaleString("de-DE")}: ${input.text}` };
      }
      case "list_reminders": {
        const reminders = load("reminders.json", []).filter((r) => !r.fired);
        if (!reminders.length) return { content: "Keine anstehenden Erinnerungen." };
        return {
          content: reminders
            .map((r) => `[${r.id}] ${new Date(r.due).toLocaleString("de-DE")}: ${r.text}`)
            .join("\n"),
        };
      }

      case "set_timer": {
        const secs = Math.max(1, Math.round(Number(input.seconds) || 0));
        return {
          content: `Timer über ${secs} Sekunden gestellt.`,
          action: { type: "timer", seconds: secs, label: input.label || "Timer" },
        };
      }

      case "calculate":
        return { content: calculate(input.expression) };

      case "get_current_time":
        return { content: new Date().toLocaleString("de-DE", { dateStyle: "full", timeStyle: "short" }) };

      default:
        return { content: `Unbekanntes Werkzeug: ${name}` };
    }
  } catch (err) {
    return { content: `Fehler bei ${name}: ${String(err?.message || err)}` };
  }
}
