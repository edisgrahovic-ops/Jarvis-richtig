# Stowe Studio – Deine Verkaufs-Webseite 🧥✈️

Willkommen! Das ist die komplette Webseite für deine Marke **Stowe Studio**.
Diese Anleitung ist für **Anfänger** geschrieben – Schritt für Schritt, ohne
Vorwissen. Nimm dir Zeit und arbeite die Abschnitte der Reihe nach durch.

---

## 📂 Was liegt wo? (Überblick)

```
Jarvis-richtig/
│
├── index.html              → Die Webseite selbst (alle Texte & Abschnitte)
├── README.md               → Diese Anleitung
│
├── css/
│   └── style.css           → Das Design (Farben, Layout, Animationen)
│
├── js/
│   ├── shopify-config.js   → DEINE SCHALTZENTRALE für Shopify (hier trägst du alles ein)
│   └── main.js             → Die Logik (Warenkorb, Menü, FAQ, Animationen)
│
└── images/
    ├── logo.svg            → Platzhalter-Logo (ersetzen)
    ├── platzhalter.svg     → Wird automatisch angezeigt, wenn ein Foto fehlt
    ├── pullover-1.jpg      → (fügst du ein) Foto Zip-Pullover
    ├── nackenkissen-1.jpg  → (fügst du ein) Foto Nackenkissen
    ├── hero.jpg            → (fügst du ein) großes Bild ganz oben
    ├── flughafen-1.jpg     → (fügst du ein) Bild "Am Flughafen"
    └── ueber-uns.jpg       → (fügst du ein) Bild "Über uns"
```

> 💡 **Faustregel:** Texte änderst du in `index.html`. Aussehen in `css/style.css`.
> Shopify-Daten **nur** in `js/shopify-config.js`.

---

## 1️⃣ Die Seite lokal öffnen und testen

Du brauchst **keine Installation**. Es gibt zwei Wege:

### Weg A – Einfach (Doppelklick)
1. Öffne den Projekt-Ordner auf deinem Computer.
2. Doppelklicke auf die Datei **`index.html`**.
3. Die Seite öffnet sich in deinem Browser. Fertig! 🎉

> Solange du noch keine Shopify-Daten eingetragen hast, läuft die Seite im
> **Demo-Modus**: Der Warenkorb funktioniert zum Ausprobieren, aber es wird
> noch nichts wirklich bestellt.

### Weg B – Empfohlen (mit lokalem Server)
Manche Funktionen (und später Shopify) arbeiten zuverlässiger über einen
kleinen lokalen Server. Wenn du **VS Code** benutzt:

1. Installiere die kostenlose Erweiterung **„Live Server“**.
2. Rechtsklick auf `index.html` → **„Open with Live Server“**.
3. Die Seite öffnet sich und lädt bei jeder Änderung automatisch neu.

Alternativ mit Python (falls installiert), im Projekt-Ordner im Terminal:
```bash
python3 -m http.server 8000
```
Dann im Browser öffnen: `http://localhost:8000`

---

## 2️⃣ Deine Produktfotos und das Logo einfügen

Alle Bilder liegen im Ordner **`images/`**. Du ersetzt einfach die
Platzhalter durch deine eigenen Dateien – **gleiche Dateinamen benutzen**,
dann musst du im Code nichts ändern.

| Was | Dateiname (genau so) | Empfehlung |
|-----|----------------------|------------|
| Logo | `logo.svg` | SVG oder PNG mit transparentem Hintergrund |
| Großes Bild oben | `hero.jpg` | Hochformat, hell, ca. 1200 px breit |
| Pullover-Foto | `pullover-1.jpg` | Quadratisch (z. B. 1000×1000 px) |
| Nackenkissen-Foto | `nackenkissen-1.jpg` | Quadratisch (z. B. 1000×1000 px) |
| Flughafen-Bild | `flughafen-1.jpg` | Hochformat |
| Über-uns-Bild | `ueber-uns.jpg` | Querformat |

**So geht's:**
1. Benenne dein Foto exakt so wie in der Tabelle (z. B. `pullover-1.jpg`).
2. Kopiere es in den Ordner `images/` und überschreibe die alte Datei.
3. Lade die Seite im Browser neu (Taste **F5**).

> **Logo als PNG statt SVG?** Kein Problem. Lege `logo.png` in `images/` und
> ändere in `index.html` die eine Zeile
> `<img src="images/logo.svg" ...>` zu `<img src="images/logo.png" ...>`.

> **Fehlt ein Foto noch?** Dann zeigt die Seite automatisch eine neutrale
> „Foto folgt“-Grafik statt eines kaputten Bildes. Du kannst also jederzeit
> testen, auch ohne alle Fotos.

---

## 3️⃣ Die Seite mit Shopify verbinden

Damit echte Bestellungen möglich sind, verbindest du die Seite mit Shopify.
Das läuft über das offizielle **Shopify Buy SDK** – im Code schon vorbereitet.
Du musst nur **3 Angaben** in **einer** Datei eintragen:
**`js/shopify-config.js`**.

Alle Stellen dort sind markiert mit:
```
// >>> HIER SHOPIFY-DATEN EINTRAGEN
```

### Schritt 3.1 – Produkte in Shopify anlegen
1. Logge dich in deinem **Shopify-Adminbereich** ein.
2. Gehe zu **Produkte → Produkt hinzufügen**.
3. Lege beide Produkte an:
   - **Zip-Pullover mit Rucksack** – mit Varianten:
     - Option 1: **Farbe** → Werte: `Grau`, `Schwarz`
     - Option 2: **Größe** → Werte: `XS`, `S`, `M`, `L`, `XL`
   - **Nackenkissen mit Stauraum** (keine Varianten nötig)

   > ⚠️ **Wichtig:** Schreibe die Options-Werte **exakt** so wie auf der
   > Webseite (`Grau`, `Schwarz`, `XS`…`XL`). Nur dann findet der Code die
   > richtige Variante automatisch.

### Schritt 3.2 – Storefront-Access-Token erstellen
Der Token ist ein Zugangsschlüssel, der der Webseite erlaubt, mit deinem
Shop zu „reden“.

1. Im Shopify-Admin: **Einstellungen → Apps und Vertriebskanäle**.
2. Klicke **Apps entwickeln** (ggf. „Entwicklung von Apps erlauben“ aktivieren).
3. **App erstellen** → gib ihr einen Namen, z. B. „Webseite“.
4. Öffne den Reiter **Konfiguration** → **Storefront-API** → aktivieren.
5. Setze die Häkchen (Scopes) für Produkte und Checkout, u. a.:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
6. **Speichern**, dann Reiter **API-Zugangsdaten** → dort findest du den
   **Storefront-API-Zugriffstoken**. Kopiere ihn.

> 🔒 **Ist das sicher?** Ja. Der Storefront-Token darf öffentlich im Code
> stehen – so ist Shopify konzipiert. Er erlaubt nur Einkaufen, nicht das
> Verwalten deines Shops.

### Schritt 3.3 – Produkt-IDs herausfinden
1. Öffne im Admin ein Produkt (z. B. den Pullover).
2. Schau in die **Adresszeile (URL)** deines Browsers. Am Ende steht eine
   lange Zahl, z. B.:
   `https://admin.shopify.com/store/dein-shop/products/`**`8123456789012`**
3. Diese Zahl (`8123456789012`) ist die **Produkt-ID**.
4. Mache das für beide Produkte.

### Schritt 3.4 – Alles eintragen
Öffne **`js/shopify-config.js`** und fülle die Felder aus. Beispiel:

```js
window.SHOPIFY_CONFIG = {
  domain: "stowe-studio.myshopify.com",          // deine .myshopify.com-Adresse
  storefrontAccessToken: "1a2b3c4d5e6f7g8h...",  // der Token aus Schritt 3.2
  products: {
    pullover: "8123456789012",                   // Produkt-ID aus Schritt 3.3
    nackenkissen: "8987654321098"                // Produkt-ID aus Schritt 3.3
  },
  demoPreise: { pullover: 89.00, nackenkissen: 39.00 }
};
```

Speichern, Seite neu laden – **fertig!** Sobald alle vier Felder ausgefüllt
sind, schaltet die Seite automatisch vom Demo-Modus in den echten
Shopify-Modus. In der Browser-Konsole (Taste **F12**) siehst du dann:
`Stowe Studio: Shopify-Modus aktiv.`

---

## 4️⃣ Den automatischen Rabatt „2 Pullover = Nackenkissen gratis“ einrichten

Dieses Angebot wird **nicht im Code** berechnet, sondern **in Shopify** als
automatischer Rabatt. Die Webseite bewirbt es nur. So stellst du es ein:

1. Im Shopify-Admin: **Rabatte → Rabatt erstellen**.
2. Wähle **Automatischer Rabatt** (nicht „Rabattcode“ – automatisch ist
   bequemer für Kunden).
3. **Typ:** „Kauf X, erhalte Y“ (englisch: *Buy X, get Y*).
4. **Kunde kauft (X):**
   - Menge: **2**
   - Produkt: **Zip-Pullover mit Rucksack**
5. **Kunde erhält (Y):**
   - Menge: **1**
   - Produkt: **Nackenkissen mit Stauraum**
   - Rabatt: **Kostenlos (100 %)**
6. Optional: Nutzung pro Bestellung begrenzen (z. B. max. 1×).
7. **Speichern** und den Rabatt **aktivieren**.

Ab jetzt wird das Nackenkissen automatisch gratis, sobald 2 Pullover im
Warenkorb sind – der Abzug passiert auf der Shopify-Bezahlseite.

> 💡 Der Warenkorb auf deiner Webseite zeigt den Rabatt noch nicht an
> (das ist Absicht). Der Kunde sieht das kostenlose Nackenkissen im
> finalen Shopify-Checkout.

---

## 5️⃣ Die Seite online stellen

Deine Seite besteht nur aus einfachen Dateien – das macht das Veröffentlichen
leicht und (oft) kostenlos. Drei anfängerfreundliche Optionen:

### Option A – Netlify (empfohlen, sehr einfach)
1. Gehe auf **netlify.com** und erstelle ein kostenloses Konto.
2. Klicke auf **„Add new site“ → „Deploy manually“**.
3. Ziehe deinen kompletten Projekt-Ordner per Drag & Drop in das Fenster.
4. Nach wenigen Sekunden ist die Seite online (du bekommst eine Adresse wie
   `dein-name.netlify.app`).
5. Eigene Domain (z. B. `stowestudio.de`) kannst du dort später verbinden.

### Option B – Vercel
Ähnlich wie Netlify: Konto auf **vercel.com** erstellen, Projekt hochladen,
online gehen.

### Option C – GitHub Pages (gut, da dein Code schon bei GitHub liegt)
1. Lade dein Projekt in ein GitHub-Repository (ist hier bereits der Fall).
2. Im Repository: **Settings → Pages**.
3. Unter „Branch“ deinen Branch wählen und **Save**.
4. Nach kurzer Zeit ist die Seite unter
   `https://dein-nutzername.github.io/dein-repo/` erreichbar.

> **Wichtig:** Egal welche Option – lade **den ganzen Ordner** hoch, inklusive
> `css/`, `js/` und `images/`. Sonst fehlen Design oder Bilder.

---

## ✅ Checkliste vor dem Launch

- [ ] Alle Fotos in `images/` eingefügt (richtige Dateinamen)
- [ ] Logo ersetzt
- [ ] Texte in `index.html` an deine Marke angepasst
- [ ] Preise angepasst (in `index.html` **und** `js/shopify-config.js`)
- [ ] Shopify-Daten in `js/shopify-config.js` eingetragen
- [ ] Testkauf im Shopify-Modus durchgeführt
- [ ] Automatischer Rabatt in Shopify eingerichtet und getestet
- [ ] **Pflicht in Deutschland:** Impressum, Datenschutzerklärung, AGB und
      Widerrufsbelehrung erstellt und im Footer verlinkt
- [ ] Seite online gestellt

---

## ⚖️ Rechtlicher Hinweis (bitte ernst nehmen)

In Deutschland sind **Impressum, Datenschutzerklärung, AGB und
Widerrufsbelehrung** für Online-Shops Pflicht. Im Footer sind dafür bereits
Platzhalter-Links vorhanden (`href="#"`). Erstelle diese Seiten und verlinke
sie dort. Lass dich im Zweifel rechtlich beraten – diese README ersetzt
keine Rechtsberatung.

---

## 🛠️ Kleine Anpassungen leicht gemacht

- **Farben ändern:** In `css/style.css` ganz oben im Bereich `:root` die
  Farbwerte (z. B. `--color-accent`) anpassen – wirkt überall.
- **Texte ändern:** In `index.html` den gewünschten Text zwischen den Tags
  überschreiben. Kommentare (`<!-- ... -->`) helfen dir, den richtigen
  Abschnitt zu finden.
- **Preise ändern:** In `index.html` bei den Produktkarten **und** in
  `js/shopify-config.js` unter `demoPreise` (für den Demo-Warenkorb).

Viel Erfolg mit Stowe Studio! 🚀
