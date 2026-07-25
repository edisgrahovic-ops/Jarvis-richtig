# 🛒 Shopify-Checkliste – Stowe Studio

Der Bezahlvorgang läuft über Shopify (JS Buy SDK + Shopify-Checkout).
Diese Einstellungen musst du **im Shopify-Adminbereich** prüfen, damit
Checkout und Recht zusammenpassen. Die Webseite selbst kann das nicht
erzwingen – es sind Einstellungen in deinem Shopify-Konto.

> Zugangsdaten der Webseite stehen in `js/shopify-config.js`
> (Shop-Domain + öffentlicher Storefront-Token – der Token ist für den
> Browser gedacht und darf öffentlich sein).

---

## Produkte & Preise

- [ ] Beide Produkte angelegt: **Zip-Pullover** (49,90 €) und **Nackenkissen**
      (19,90 €).
- [ ] Pullover-Varianten: Farbe **Grau/Schwarz** × Größe **S/M/L/XL**.
- [ ] Nackenkissen-Varianten: Farbe **Grau/Schwarz**.
- [ ] Preise in Shopify = Preise auf der Webseite (sonst Verwirrung/PAngV-Problem).
- [ ] Lagerbestand/Verfügbarkeit gepflegt (sonst „ausverkauft" im Checkout).

## Gratis-Nackenkissen-Aktion (2 Pullover → Kissen gratis)

- [ ] Die Webseite legt das Gratis-Kissen automatisch in den Warenkorb
      (siehe `pruefeGeschenk` in js/main.js). Prüfe, dass der **Rabatt im
      Shopify-Checkout tatsächlich als 0,00 €** ankommt.
- [ ] Falls du stattdessen einen Shopify-Rabattcode nutzt: Code hinterlegen und
      testen.

## Checkout & Recht

- [ ] **AGB-/Widerruf-Zustimmung:** Im Shopify-Checkout eine Checkbox oder einen
      Hinweis mit Link zu AGB & Widerruf aktivieren (Shopify: Checkout-
      Einstellungen / „Rechtliches"). Die Webseite weist im Warenkorb bereits
      darauf hin, der Checkout sollte es ebenfalls tun.
- [ ] **Rechtstexte in Shopify hinterlegen:** Impressum, Datenschutz, AGB,
      Widerruf, Versand (Shopify → Einstellungen → Richtlinien). Am besten mit
      den finalen Texten vom Rechtstexte-Dienst.
- [ ] **Versandzonen:** Nur **Deutschland** aktivieren (Shop liefert ausschließlich
      innerhalb Deutschlands) und **versandkostenfrei** einstellen.
- [ ] **Steuern:** MwSt.-Einstellungen passend zu deinem Status
      (Kleinunternehmer vs. regelbesteuert). Preise „inkl. MwSt." anzeigen.

## Zahlung

- [ ] **PayPal** aktiviert und verifiziert.
- [ ] **Kreditkarte** (Shopify Payments oder Anbieter) aktiviert.
- [ ] Auszahlungskonto (Bankverbindung) hinterlegt.
- [ ] Test-/Echtbestellung durchführen und Zahlungseingang prüfen.

## E-Mails & Benachrichtigungen

- [ ] Bestellbestätigung, Versandbestätigung, Stornomail auf Deutsch geprüft.
- [ ] Absenderadresse (stowestudioofficial@gmail.com) verifiziert.
- [ ] Sendungsverfolgung: Tracking-Nummer wird an Kunden versendet.

## Domain & Technik

- [ ] Webseite läuft unter **stowestudio.de** (GitHub Pages, HTTPS aktiv).
- [ ] `js/shopify-config.js`: Shop-Domain + Storefront-Token korrekt.
- [ ] Produkt-IDs in der Config stimmen mit den Shopify-Produkten überein.
- [ ] Content-Security-Policy erlaubt Shopify (sdks.shopifycdn.com,
      *.myshopify.com) – bereits in index.html gesetzt; nach Änderungen testen.

---

**Zum Schluss:** Eine komplette Testbestellung von der Startseite bis zur
Bestätigungsmail durchspielen. Erst dann Werbung schalten.
