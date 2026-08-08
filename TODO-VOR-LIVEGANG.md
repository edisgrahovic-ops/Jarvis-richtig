# ✅ TODO vor dem Livegang – Stowe Studio

Diese Liste musst du abarbeiten, **bevor** du echte Kunden auf den Shop lässt
und Geld einnimmst. Sie ist in drei Stufen sortiert:

- 🔴 **Blocker** – ohne das darfst du NICHT verkaufen (rechtlich/abmahngefährdet)
- 🟡 **Wichtig** – kurzfristig nach Start erledigen
- 🟢 **Optional** – verbessert den Shop, ist aber nicht zwingend

> **Praktischer Tipp:** Führe vor dem Livegang das Prüfskript aus:
> `npm run check-todos`
> Es zeigt alle noch offenen Ausfüll-Stellen (rote `todo-marker`) im Code.
> Solange dort etwas rot markiert ist, fehlen dir Pflichtangaben.

---

## 🔴 Blocker (zwingend vor dem ersten Verkauf)

- [ ] **Gewerbe anmelden.** Ein Online-Shop mit Gewinnabsicht ist ein Gewerbe.
      Anmeldung beim Gewerbeamt deiner Stadt. Kosten meist 20–60 €.
- [ ] **Steuerliche Erfassung beim Finanzamt.** Nach der Gewerbeanmeldung bekommst
      du den Fragebogen zur steuerlichen Erfassung (über ELSTER). Danach erhältst
      du deine **Steuernummer**.
- [ ] **Kleinunternehmer? (§ 19 UStG)** Entscheide, ob du die Kleinunternehmer-
      regelung nutzt (keine Umsatzsteuer ausweisen) oder regelbesteuert bist.
      Das beeinflusst deine Preisauszeichnung und das Impressum.
- [ ] **USt-IdNr. beantragen** (falls regelbesteuert oder EU-weit nötig) und im
      Impressum ergänzen. → siehe todo-marker im Impressum.
- [ ] **Rechtstexte von einem Dienst beziehen** (z. B. eRecht24, IT-Recht Kanzlei,
      Trusted Shops) und einsetzen: **Datenschutzerklärung, AGB, Widerrufs-
      belehrung + Muster-Widerrufsformular**. → alle als Gerüst mit todo-marker
      vorhanden. NICHT selbst schreiben.
- [ ] **Widerruf: Rücksendekosten & -adresse** ausdrücklich aufnehmen (Käufer
      trägt Rücksendekosten – sonst zahlst du als Händler). → todo-marker im
      Widerruf.
- [ ] **Verpackungsregister LUCID (ZSVR).** Wer verpackte Ware an Endkunden
      versendet, muss sich bei LUCID registrieren und lizenzieren
      (Verpackungsgesetz). Auch bei Dropshipping relevant, sobald du als
      Inverkehrbringer giltst. Prüfen und registrieren.
- [ ] **GPSR-Herstellerangaben vervollständigen.** Name + Anschrift + Kontakt des
      tatsächlichen Herstellers/der Fabrik, Modell-/Chargennummer, Warn- und
      Sicherheitshinweise. → todo-marker in den Produktkarten.
- [ ] **Textilkennzeichnung prüfen.** Materialangabe „100 % Polyester" muss der
      Realität entsprechen (vom Lieferanten bestätigen lassen). Bei falscher
      Angabe drohen Abmahnungen.
- [ ] **Impressum vollständig?** Verantwortlicher, Anschrift, E-Mail, Telefon,
      ggf. USt-IdNr., Plattform-Streitschlichtungshinweis (OS-Plattform).
      → todo-marker im Impressum abarbeiten.
- [ ] **Zahlungsdienstleister DSGVO.** In der Datenschutzerklärung müssen Shopify,
      PayPal, Kreditkarte, Cookie-Consent und Datenweitergabe an den
      Produktionspartner (Drittland China) korrekt beschrieben sein.

## 🟡 Wichtig (kurz nach dem Start)

- [ ] **Produkthaftpflicht-/Betriebshaftpflichtversicherung** abschließen. Bei
      Textilien/Reiseprodukten wichtig, falls ein Produkt einen Schaden verursacht.
- [ ] **Echte Testbestellung** durchführen (mit echter Karte, kleiner Betrag):
      Bestellung → Zahlung → Bestätigungsmail → Lieferung → Storno/Rückgabe testen.
- [ ] **Bilder-Nutzungsrechte** schriftlich bestätigen lassen → siehe BILDRECHTE.md.
- [ ] **Cookie-Consent live prüfen:** Werden Statistik/Marketing-Skripte wirklich
      erst NACH Zustimmung geladen? (Der Consent-Mechanismus liegt in
      js/consent.js.)
- [ ] **Lieferzeit realistisch?** „10–14 Werktage" mit dem Produktionspartner
      abgleichen. Falsche Lieferzeitangaben sind abmahnfähig.
- [ ] **Preise & MwSt.** final prüfen (PAngV: Gesamtpreis inkl. MwSt., Hinweis
      auf Versandkosten – bei dir „versandkostenfrei").

## 🟢 Optional (später / Verbesserungen)

- [ ] Meta Pixel / Google Analytics einbauen – **nur** über das Consent-Gate
      (`type="text/plain" data-consent="marketing"` bzw. `"statistik"`).
- [ ] Newsletter (mit Double-Opt-In und passender Datenschutz-Klausel).
- [ ] Bewertungen/Reviews – erst wenn echt. **Keine erfundenen Bewertungen**
      (kein aggregateRating im JSON-LD, § 5 UWG).
- [ ] Trusted-Shops-Siegel o. Ä. für mehr Vertrauen.
- [ ] Weitere Produktbilder (Nackenkissen mit Schultergurt + beide Farben).

---

**Merksatz:** Erst wenn `npm run check-todos` „keine offenen Stellen" meldet
UND alle 🔴-Blocker oben abgehakt sind, ist der Shop bereit für echte Kunden.
