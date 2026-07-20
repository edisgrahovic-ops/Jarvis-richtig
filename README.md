# 🤖 Jarvis – dein Dropshipping-Assistent

Ein KI-Assistent im Stil von Iron Mans "Jarvis" für euer Dropshipping-Business.
Du kannst **mit ihm reden** (Sprache) oder tippen. Er hilft bei allen Fragen rund
ums Business und kann euren **Shopify-Shop auslesen** und Vorschläge machen.

> Gebaut von Edis & Freund. Gehirn: **Google Gemini** (kostenloses Kontingent). Läuft als Web-App im Browser.

---

## Was Jarvis kann

- 🎤 **Reden & zuhören** – Sprachein- und -ausgabe direkt im Browser (am besten in Chrome).
- 🧠 **Mitdenken** – beantwortet Fragen zu Produktrecherche, Nischen, Lieferanten, Marketing (TikTok/Meta Ads), Preisen, Kundenservice u.v.m.
- 🛒 **Shopify lesen** – zeigt Produkte, Bestellungen und geschätzten Umsatz an und **schlägt Aktionen vor**.
- 🔒 **Sicher** – Jarvis ändert von sich aus **nichts** in eurem Shop. Er liest und empfiehlt, ihr entscheidet.

---

## In 5 Minuten startklar

### 1. Voraussetzung
[Node.js](https://nodejs.org) (Version 20 oder neuer) installieren.

### 2. Projekt einrichten
```bash
npm install
cp .env.example .env
```

### 3. Kostenlosen Gemini-Schlüssel eintragen (damit Jarvis wirklich denkt)
1. Geh auf **https://aistudio.google.com/apikey** und melde dich mit deinem Google-Konto an.
2. Klick auf **"Create API key"** (bzw. "API-Schlüssel erstellen") → Schlüssel kopieren.
3. Trage ihn in die Datei `.env` ein:
   ```
   GEMINI_API_KEY=dein-gemini-schlüssel-hier
   ```

> Ohne Schlüssel läuft Jarvis im **Demo-Modus** und erklärt nur, was er können wird.
> Das Gemini-Kontingent ist zum Testen **kostenlos** – kein Zahlungsmittel nötig.

### 4. Starten
```bash
npm start
```
Dann im Browser öffnen: **http://localhost:3000**

Auf "🎤" tippen und lossprechen – oder einfach tippen. 🚀

---

## Jarvis online stellen (öffentlicher Link zum Teilen)

Wenn ihr Jarvis nicht nur lokal, sondern über einen **Link im Internet** nutzen wollt
(z. B. um ihn dem Freund zu schicken oder vom Handy zu öffnen) – kostenlos über **Render**:

1. Geht auf **https://render.com** und meldet euch mit **GitHub** an.
2. Oben rechts **New → Blueprint**.
3. Wählt das Repository **`Jarvis-richtig`** aus (Branch mit dem Code).
4. Render erkennt die Datei `render.yaml`. Beim Feld **`GEMINI_API_KEY`** euren Gemini-Schlüssel eintragen.
5. **Apply / Deploy** klicken. Nach 1–2 Minuten bekommt ihr eine Adresse wie
   `https://jarvis-dropshipping-xyz.onrender.com` – **das ist euer Jarvis-Link.** 🎉

> Hinweis: Im Gratis-Tarif „schläft" der Server nach Inaktivität ein und braucht beim
> ersten Aufruf ~30 Sekunden zum Aufwachen. Für den Start völlig okay.

---

## Shopify verbinden (optional)

Damit Jarvis euren echten Shop auslesen kann:

1. In eurem Shopify-Admin: **Einstellungen → Apps und Vertriebskanäle → Apps entwickeln → App erstellen**.
2. Bei **Admin-API-Integration** diese Lese-Rechte (Scopes) aktivieren:
   `read_products`, `read_orders`
3. App installieren und den **Admin API Access Token** (beginnt mit `shpat_`) kopieren.
4. In die `.env` eintragen:
   ```
   SHOPIFY_STORE=euerladen.myshopify.com
   SHOPIFY_TOKEN=shpat_xxxxxxxxxxxxxxxxx
   ```
5. Jarvis neu starten. Fertig – jetzt kann er z.B. "Wie war unser Umsatz diese Woche?" beantworten.

> Wir vergeben absichtlich nur **Leserechte**. So kann Jarvis nichts kaputt machen.

---

## Aufbau des Projekts

| Datei | Zweck |
|-------|-------|
| `server.js` | Backend: verbindet Browser ↔ Gemini ↔ Shopify |
| `shopify.js` | Nur-lesende Shopify-Anbindung (Produkte, Bestellungen, Umsatz) |
| `public/index.html` | Das Jarvis-Interface (Design, Chat, Sprache) |
| `.env` | Eure geheimen Schlüssel (wird **nicht** mit Git geteilt) |

---

## Ideen für die nächsten Ausbaustufen

- Produkt-/Nischen-Recherche automatisch mit Web-Suche
- Jarvis darf Aktionen nach eurer Bestätigung auch selbst ausführen (mit "OK"-Klick)
- Anbindung an Meta/TikTok Ads für Werbe-Auswertungen
- Erinnerungen & tägliche Business-Zusammenfassung

Sagt Jarvis (oder mir) einfach Bescheid, was als Nächstes kommen soll. 💪
