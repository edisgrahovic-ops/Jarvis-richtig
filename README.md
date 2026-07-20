# J.A.R.V.I.S. 🛡️

Dein persönlicher KI-Assistent im Iron-Man-Stil – mit futuristischem Interface,
**Sprachsteuerung**, **echten Aktionen** und **kostenloser KI** über Google Gemini.
Läuft im Browser und lässt sich auf dem **Handy als App installieren** (PWA).

## Was Jarvis kann

- 🎙️ **Sprachein- und -ausgabe** – rede mit ihm, er antwortet mit Stimme
- 🧠 **Echte KI** – standardmäßig über **Google Gemini (kostenlos)**
- 🛠️ **Echte Aktionen** (Tool-Calling):
  - 🌦️ **Wetter** für jeden Ort (aktuell + 3 Tage Vorhersage)
  - 📝 **Notizen & To-Dos** dauerhaft speichern, auflisten, löschen
  - ⏰ **Erinnerungen**, die zur richtigen Zeit am Handy klingeln
  - ⏱️ **Timer** und **Rechnen** (inkl. „15% von 240")
- 📱 **Mobil nutzbar** – als App auf dem Homescreen installierbar

## KI-Anbieter

Jarvis unterstützt zwei Anbieter, umschaltbar über die Variable `AI_PROVIDER`:

| Anbieter    | Kosten            | Schlüssel her von                        | Web-Suche |
|-------------|-------------------|------------------------------------------|-----------|
| **gemini**  | **kostenlos** ✅  | <https://aistudio.google.com/apikey>     | –         |
| anthropic   | nach Nutzung 💳   | <https://console.anthropic.com>          | ✅        |

**Standard ist Gemini** – dafür brauchst du nur einen kostenlosen Google-Schlüssel
(keine Kreditkarte nötig).

## Auf dem Handy einrichten (Render, kostenlos + HTTPS)

Für die Sprachsteuerung am Handy wird **HTTPS** gebraucht. Der einfachste Weg ist
[Render](https://render.com) – kostenlos und mit automatischem HTTPS.

### 1. Gemini-Schlüssel holen (kostenlos)
Auf <https://aistudio.google.com/apikey> mit Google anmelden → **Create API key**
→ Schlüssel kopieren.

### 2. Auf Render deployen (1-Klick-Button)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/edisgrahovic-ops/Jarvis-richtig)

1. Auf den Button klicken und bei Render mit GitHub anmelden.
2. Render liest die `render.yaml`. Nur noch **einen** Wert eintragen:
   `GEMINI_API_KEY = ...` (dein Schlüssel aus Schritt 1).
3. **Apply / Create** klicken. Nach ~1 Minute bekommst du eine Adresse wie
   `https://jarvis-xxxx.onrender.com`.

### 3. Am Handy als App installieren
Die Adresse am Handy öffnen und installieren:
- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm"
- **Android (Chrome):** Menü ⋮ → „App installieren"

> Fertig – Jarvis läuft jetzt überall auf deinem Handy, kostenlos, mit Sprache,
> Wetter, Notizen, Erinnerungen und Timer.

> ℹ️ Der kostenlose Render-Plan „schläft" nach Inaktivität ein; der erste Aufruf
> danach dauert ein paar Sekunden. Gespeicherte Notizen/Erinnerungen können bei
> einem Neustart des Dienstes zurückgesetzt werden.

## Lokal ausprobieren

```bash
npm install
cp .env.example .env      # GEMINI_API_KEY eintragen
npm start                 # -> http://localhost:3000
```

Für Sprache am Handy unterwegs ohne Hosting: HTTPS-Tunnel mit
[`ngrok`](https://ngrok.com): `ngrok http 3000`.

## Konfiguration (.env / Environment)

| Variable          | Bedeutung                                            | Standard           |
|-------------------|------------------------------------------------------|--------------------|
| `AI_PROVIDER`     | `gemini` (kostenlos) oder `anthropic`                | `gemini`           |
| `GEMINI_API_KEY`  | Google-Gemini-Schlüssel (bei `gemini`)               | –                  |
| `ANTHROPIC_API_KEY`| Claude-Schlüssel (nur bei `anthropic`)              | –                  |
| `JARVIS_MODEL`    | Modell überschreiben                                  | je nach Anbieter   |
| `PORT`            | Port des Servers                                     | `3000`             |

## Technik

- **Backend:** Node.js + Express. Agentische **Tool-Schleife**: die KI ruft
  Werkzeuge auf (`tools.js`), der Server führt sie aus und liefert die Ergebnisse
  zurück, bis die Antwort steht.
- **Anbieter-Adapter:** `providers/gemini.js` und `providers/anthropic.js` –
  gleiche Werkzeuge, unterschiedliches API-Format. Umschaltbar per `AI_PROVIDER`.
- **Aktionen:** Wetter über [Open-Meteo](https://open-meteo.com) (kein Key nötig),
  Notizen/Erinnerungen als JSON im `data/`-Ordner, Timer & Erinnerungen als
  Benachrichtigung im Browser.
- **Frontend:** reines HTML/CSS/JS, Web Speech API für Sprache, Canvas-Reaktor,
  PWA für die Handy-Installation.
- Kein API-Schlüssel im Browser – alle KI-Aufrufe laufen über den Server.

## Eigene Aktionen ergänzen

Neues Werkzeug in `tools.js` (`toolSpecs` + `runTool`) definieren – beide Anbieter
nutzen es dann automatisch.
