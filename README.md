# Stowe Studio – Automatische Shop-Einrichtung

Dieses kleine Node.js-Projekt richtet deinen **Stowe-Studio**-Shopify-Shop
automatisch ein: Es legt das Produkt **Backpack Hoodie** (mit 8 Varianten) an,
lädt deine Produktbilder hoch, erstellt die wichtigsten Seiten und Rechtstext-
Platzhalter und schlägt dir am Ende eine passende Navigation vor.

Es nutzt die **Shopify GraphQL Admin API** (nicht die veraltete REST-API).

> **Du bist kein Profi-Entwickler?** Kein Problem. Folge einfach der Anleitung
> von oben nach unten. Alles, was du eingeben musst, ist markiert.

---

## Was das Skript macht

| Schritt | Was passiert | Sichtbarkeit |
|--------:|--------------|--------------|
| 1 | Produkt „Backpack Hoodie“ (49,90 €, Farben Grau/Schwarz, Größen S/M/L/XL = 8 Varianten) | **Entwurf** |
| 2 | Bilder aus dem Ordner `./images` hochladen und zuordnen | – |
| 3 | Seiten: Startseiten-Inhalt, Über uns, FAQ, Kontakt | **Veröffentlicht** |
| 4 | Rechtstext-Platzhalter: Impressum, Datenschutz, AGB, Widerruf | **Entwurf** (Warnhinweis) |
| 5 | Navigations-Vorschlag im Terminal ausgeben | – |

Das Skript ist **mehrfach ausführbar**: Bereits vorhandene Seiten werden
übersprungen.

---

## Voraussetzungen

- **Node.js** Version 20 oder neuer. Prüfen mit: `node --version`
  (Falls nicht installiert: von <https://nodejs.org> herunterladen.)
- Ein **Shopify-Shop** mit Adminzugang.

---

## Schritt 1: Custom App in Shopify erstellen und Access Token holen

Der „Access Token“ ist wie ein Schlüssel, mit dem das Skript in deinem Namen
mit Shopify sprechen darf. So bekommst du ihn:

1. Melde dich im **Shopify-Adminbereich** an.
2. Gehe zu **Einstellungen** (unten links) ➜ **Apps und Vertriebskanäle**.
3. Klicke oben auf **Apps entwickeln** (englisch: *Develop apps*).
   - Falls der Button ausgegraut ist: einmal **„Entwicklung von Apps erlauben“** klicken.
4. Klicke **App erstellen**, gib ihr einen Namen (z. B. `Stowe Setup`) und bestätige.
5. Öffne den Reiter **Konfiguration** ➜ **Admin-API-Integration** ➜ **Konfigurieren**.
6. Aktiviere genau diese Berechtigungen (**Scopes**) und speichere:
   - `write_products` – zum Anlegen von Produkt und Varianten
   - `write_content` – zum Anlegen der Seiten
   - `write_files`   – zum Hochladen der Bilder
7. Gehe auf den Reiter **API-Zugangsdaten** ➜ **App installieren**.
8. Jetzt erscheint der **Admin-API-Access-Token** (beginnt mit `shpat_...`).
   **Klicke „Token anzeigen“ und kopiere ihn sofort** – er wird nur EINMAL angezeigt!

> 🔒 **Wichtig:** Behandle diesen Token wie ein Passwort. Gib ihn niemals weiter
> und schreibe ihn niemals direkt in den Code. Wir legen ihn gleich sicher in
> der `.env`-Datei ab.

---

## Schritt 2: Projekt vorbereiten

Öffne ein Terminal in diesem Projektordner und installiere die Abhängigkeiten:

```bash
npm install
```

---

## Schritt 3: Zugangsdaten eintragen (.env-Datei)

1. Kopiere die Vorlage `.env.example` zu einer neuen Datei namens `.env`:

   ```bash
   cp .env.example .env
   ```

2. Öffne die neue Datei `.env` in einem Texteditor und trage deine Werte ein:

   ```env
   SHOPIFY_SHOP_DOMAIN=dein-shop.myshopify.com
   SHOPIFY_ACCESS_TOKEN=shpat_dein_echter_token
   SHOPIFY_API_VERSION=2025-07
   ```

   - **SHOPIFY_SHOP_DOMAIN**: die technische Adresse deines Shops, die auf
     `.myshopify.com` endet – **nicht** deine schöne Domain `stowestudio.de`.
     Du findest sie im Admin oben in der Browser-Adresszeile.
   - **SHOPIFY_ACCESS_TOKEN**: der Token aus Schritt 1.
   - **SHOPIFY_API_VERSION**: kannst du so lassen.

> Die Datei `.env` wird **nicht** ins Git hochgeladen (dafür sorgt `.gitignore`),
> deine Zugangsdaten bleiben also privat.

---

## Schritt 4: Bilder ablegen (optional)

Lege deine Produktbilder in den Ordner `./images`. Erlaubt sind `.jpg`, `.jpeg`,
`.png`, `.webp` und `.gif`.

Die Bilder werden in **alphabetischer Reihenfolge** hochgeladen – benenne sie
also z. B. so, damit das schönste Bild zuerst kommt:

```
images/
  01-hero.jpg
  02-detail.jpg
  03-getragen.jpg
```

> **Noch keine Bilder?** Kein Problem. Das Skript läuft auch ohne Bilder sauber
> durch. Du kannst sie später hinzufügen und das Skript einfach erneut starten.

---

## Schritt 5: Skript starten

```bash
npm run setup
```

Du siehst im Terminal Schritt für Schritt, was passiert. Am Ende bekommst du
einen Navigations-Vorschlag und eine Liste deiner nächsten To-dos.

---

## Nach dem Lauf: Deine Aufgaben

1. **Produkt prüfen & veröffentlichen:** Das Produkt liegt als *Entwurf* im
   Admin unter *Produkte*. Prüfe Bilder, Beschreibung und Preis und stelle es
   auf *Aktiv*, wenn alles passt.
2. **⚠️ Rechtstexte ersetzen:** Impressum, Datenschutz, AGB und Widerruf sind
   nur **Platzhalter** und **rechtlich nicht gültig**. Ersetze sie unbedingt
   durch echte, geprüfte Texte, bevor du den Shop öffnest.
3. **Menüs anlegen:** Übernimm den Navigations-Vorschlag aus dem Terminal unter
   *Onlineshop ➜ Menüs*.

---

## Texte ändern

Alle Texte, Preise, Farben und Größen stehen gebündelt in **einer** Datei:

```
content/inhalte.js
```

Du kannst dort gefahrlos Wörter ändern – lass nur die Anführungszeichen `"..."`
und die Kommas stehen. Nach einer Änderung einfach das Skript erneut starten.

---

## Projektstruktur

```
.
├── index.js              ← Startdatei (führt alle Schritte aus)
├── content/
│   └── inhalte.js        ← ALLE Texte & Produktdaten (deine Datei zum Bearbeiten)
├── src/
│   ├── shopify.js        ← Verbindung & Fehlerbehandlung
│   ├── produkt.js        ← Produkt + Varianten (productCreate, productVariantsBulkCreate)
│   ├── medien.js         ← Bilder (stagedUploadsCreate, productCreateMedia)
│   ├── seiten.js         ← Seiten (pageCreate)
│   └── navigation.js     ← Navigations-Vorschlag
├── images/               ← Hier deine Produktbilder ablegen
├── .env.example          ← Vorlage für die Zugangsdaten
└── .env                  ← Deine echten Zugangsdaten (wird NICHT committet)
```

---

## Hilfe bei Fehlern

Das Skript versucht, Fehler in Klartext zu erklären. Die häufigsten:

- **„Zugriff verweigert (HTTP 401/403)“** – Der Access Token ist falsch/abgelaufen
  oder deiner App fehlen die Scopes `write_products`, `write_content`,
  `write_files`. ➜ Token und Berechtigungen in Shopify prüfen (Schritt 1).
- **„Shopify-Adresse nicht gefunden (HTTP 404)“** – `SHOPIFY_SHOP_DOMAIN` ist
  falsch. Es muss die `.myshopify.com`-Adresse sein.
- **„Es fehlen Angaben in deiner .env-Datei“** – Du hast die `.env` noch nicht
  angelegt oder nicht ausgefüllt (Schritt 3).
