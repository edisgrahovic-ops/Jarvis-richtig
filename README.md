# J.A.R.V.I.S. 🛡️

Dein persönlicher KI-Assistent im Iron-Man-Stil – mit futuristischem Interface,
**Sprachsteuerung**, **echten Aktionen** und Anbindung an die Claude-KI. Läuft im
Browser und lässt sich auf dem **Handy als App installieren** (PWA).

## Was Jarvis kann

- 🎙️ **Sprachein- und -ausgabe** – rede mit ihm, er antwortet mit Stimme
- 🧠 **Echte KI** über die Claude-API
- 🛠️ **Echte Aktionen** (Tool-Calling):
  - 🌦️ **Wetter** für jeden Ort (aktuell + 3 Tage Vorhersage)
  - 🔎 **Web-Suche** für aktuelle Infos & Fakten
  - 📝 **Notizen & To-Dos** dauerhaft speichern, auflisten, löschen
  - ⏰ **Erinnerungen**, die zur richtigen Zeit am Handy klingeln
  - ⏱️ **Timer** und **Rechnen** (inkl. „15% von 240")
- 📱 **Mobil nutzbar** – als App auf dem Homescreen installierbar

## Auf dem Handy einrichten (empfohlen: Render, kostenlos + HTTPS)

Für die Sprachsteuerung am Handy wird **HTTPS** gebraucht. Der einfachste Weg ist
[Render](https://render.com) – kostenlos und mit automatischem HTTPS.

1. **Code auf GitHub** – ist bereits erledigt (dieses Repo).
2. Bei <https://render.com> mit GitHub anmelden.
3. **New → Web Service** → dieses Repository auswählen.
   Dank der beiliegenden `render.yaml` sind Build/Start schon vorkonfiguriert
   (`npm install` / `npm start`).
4. Unter **Environment** die Variable setzen:
   `ANTHROPIC_API_KEY = sk-ant-...` (dein Schlüssel von
   <https://console.anthropic.com>).
5. **Create Web Service** klicken. Nach ~1 Minute bekommst du eine Adresse wie
   `https://jarvis-xxxx.onrender.com`.
6. Diese Adresse am Handy öffnen und **als App installieren**:
   - **iPhone (Safari):** Teilen → „Zum Home-Bildschirm"
   - **Android (Chrome):** Menü ⋮ → „App installieren"

> Fertig – Jarvis läuft jetzt überall auf deinem Handy, mit Sprache, Wetter,
> Notizen, Erinnerungen und Timer.

> ℹ️ Der kostenlose Render-Plan „schläft" nach Inaktivität ein; der erste Aufruf
> danach dauert ein paar Sekunden. Gespeicherte Notizen/Erinnerungen können bei
> einem Neustart des Dienstes zurückgesetzt werden.

## Lokal ausprobieren

```bash
npm install
cp .env.example .env      # ANTHROPIC_API_KEY eintragen
npm start                 # -> http://localhost:3000
```

Für Sprache am Handy unterwegs ohne Hosting: HTTPS-Tunnel mit
[`ngrok`](https://ngrok.com): `ngrok http 3000`.

## Konfiguration (.env / Environment)

| Variable            | Bedeutung                            | Standard          |
|---------------------|--------------------------------------|-------------------|
| `ANTHROPIC_API_KEY` | Dein Claude-API-Schlüssel (Pflicht)  | –                 |
| `JARVIS_MODEL`      | Welches Claude-Modell genutzt wird   | `claude-opus-4-8` |
| `PORT`              | Port des Servers                     | `3000`            |

## Technik

- **Backend:** Node.js + Express. Agentische **Tool-Schleife**: Claude ruft
  Werkzeuge auf (`tools.js`), der Server führt sie aus und liefert die Ergebnisse
  zurück, bis die Antwort steht.
- **Aktionen:** Wetter & Geocoding über [Open-Meteo](https://open-meteo.com)
  (kein Key nötig), Web-Suche über das Anthropic-Web-Search-Werkzeug, Notizen/
  Erinnerungen als JSON-Dateien im `data/`-Ordner, Timer & Erinnerungen werden im
  Browser als Benachrichtigung ausgelöst.
- **Frontend:** reines HTML/CSS/JS, Web Speech API für Sprache, Canvas-Reaktor,
  PWA für die Handy-Installation.
- Kein API-Schlüssel im Browser – alle KI-Aufrufe laufen über den Server.

## Eigene Aktionen ergänzen

Neues Werkzeug in `tools.js` im `tools`-Array definieren und in `runTool()` die
Ausführung hinzufügen – Jarvis nutzt es dann automatisch.
