# 📧 Shopify-Mails einrichten – Stowe Studio (klickgenaue Anleitung)

Diese Anleitung ist für die **Web-Version von Shopify** am **MacBook** (Browser:
Safari oder Chrome) und für das **aktuelle Shopify-Design (2026)**. Es ist kein
Code – du kopierst nur fertige Texte an die richtige Stelle.

Wir richten zwei Mails ein:

- **Mail 1 – Dankes-Mail** direkt nach dem Kauf (unproblematisch)
- **Mail 2 – Bewertungsbitte** zeitversetzt (Werbung → nur mit Einwilligung, § 7 UWG)

> **Immer zuerst:** Melde dich am Mac im Browser bei **admin.shopify.com** an.
> Unten **links** ist das Zahnrad **„Einstellungen"** – das brauchst du fast überall.

---

## 🔑 Schritt 0 — Absender-E-Mail bestätigen (einmalig, Pflicht)

Bevor Shopify dich Mails bearbeiten lässt, musst du deine Absenderadresse bestätigen.

1. **Einstellungen** (Zahnrad unten links).
2. Im linken Menü **„Benachrichtigungen"** anklicken.
3. Ganz oben/rechts gibt es den Bereich **„Absender-E-Mail"** (Sender email).
   Trage dort **stowestudioofficial@gmail.com** ein und klicke **Speichern**.
4. Shopify schickt dir an diese Gmail-Adresse eine Mail mit einem Bestätigungslink.
   Öffne dein Gmail, klick den Link → fertig, die Adresse ist verifiziert.

> Hinweis: Mit einer Gmail-Adresse versendet Shopify technisch „im Auftrag" über
> seine eigenen Server – das ist zum Start völlig okay. (Später kann man für noch
> bessere Zustellbarkeit eine eigene Domain-Adresse wie kontakt@stowestudio.de
> einrichten – muss aber jetzt nicht sein.)

---

## ✅ Mail 1 — Dankestext in der Bestellbestätigung

**Was das ist:** Die Bestätigung, die Shopify automatisch nach jedem Kauf sendet.
Wir tauschen nur den Begrüßungstext oben gegen unseren freundlichen Dank aus.
**Keine Bewertungsbitte** hier rein (sonst wird’s eine Werbemail → abmahnbar).

### Dein Text (zum Einfügen)

```
Vielen Dank für deine Bestellung bei Stowe Studio! 🎒

Wir freuen uns riesig, dass du mit dabei bist. Deine Bestellung wird jetzt für dich
vorbereitet und von unserem Produktionspartner verschickt. Die Lieferzeit beträgt
10–14 Werktage — sobald dein Paket unterwegs ist, bekommst du von uns eine E-Mail
mit der Sendungsnummer.

Gute Reise wünscht dir das Team von Stowe Studio ✈️
```

### Klick-für-Klick

1. **Einstellungen** → **Benachrichtigungen**.
2. Runterscrollen zum Abschnitt **„Kundenbenachrichtigungen"**.
3. In der Liste **„Bestellbestätigung"** anklicken.
4. Oben rechts auf **„Code bearbeiten"** klicken. Jetzt siehst du ein großes Feld
   **„E-Mail-Text (HTML)"** mit vielen Zeilen Code. **Keine Angst** – wir ändern nur
   eine Stelle, und es gibt unten den Knopf **„Auf Standard zurücksetzen"** als
   Sicherheitsnetz (macht alles rückgängig).
5. Such im Code diese **zwei Zeilen** (sie stehen ziemlich weit oben im Inhaltsbereich):

   ```
   <h2>{{ email_title }}</h2>
   <p>{{ email_body }}</p>
   ```

6. **Direkt UNTER die Zeile `<p>{{ email_body }}</p>`** diese zwei Zeilen einfügen:

   ```html
   <p>Wir freuen uns riesig, dass du mit dabei bist! 🎒 Deine Bestellung wird jetzt von unserem Produktionspartner vorbereitet – die Lieferzeit beträgt 10–14 Werktage. Sobald dein Paket unterwegs ist, bekommst du von uns eine E-Mail mit der Sendungsnummer.</p>
   <p>Gute Reise wünscht dir das Team von Stowe Studio ✈️</p>
   ```

   Danach sieht es so aus:

   ```html
   <h2>{{ email_title }}</h2>
   <p>{{ email_body }}</p>
   <p>Wir freuen uns riesig, dass du mit dabei bist! 🎒 Deine Bestellung wird jetzt von unserem Produktionspartner vorbereitet – die Lieferzeit beträgt 10–14 Werktage. Sobald dein Paket unterwegs ist, bekommst du von uns eine E-Mail mit der Sendungsnummer.</p>
   <p>Gute Reise wünscht dir das Team von Stowe Studio ✈️</p>
   ```

   > Die Überschrift **„Vielen Dank für deine Bestellung!"** kommt schon automatisch
   > aus `{{ email_title }}` (steht oben im Code bei `{% capture email_title %}`) – da
   > musst du nichts tun.

7. **NICHT anfassen:**
   - den großen Block `{% capture email_body %} … {% endcapture %}` ganz oben
     (regelt Sonderfälle automatisch),
   - alles ab `{% assign transaction_count … %}` und darunter (Artikel, Preise,
     Adresse) – das ist gesetzlich Pflicht.
8. Oben rechts **„Vorschau"** klicken und schauen, ob es gut aussieht. Dann
   **„Speichern"**.
9. Zum Testen oben (im Drei-Punkte-Menü **„⋯"** bzw. als Button) **„Testbenachrichtigung
   senden"** wählen – Shopify schickt dir die Mail an dein Gmail. Prüfen. Fertig.

> **Wenn du unsicher bist:** Markiere im Code-Feld alles (Cmd+A), kopiere es (Cmd+C)
> und **füge es hier in den Chat ein** – dann sage ich dir die **genaue Zeile**. Über
> den Knopf **„Auf Standard zurücksetzen"** kann nichts dauerhaft kaputtgehen.

---

## ✅ Mail 2 — Bewertungsbitte (zeitversetzt, nur mit Einwilligung)

Diese Mail ist rechtlich Werbung. Sie darf **nur** an Kunden gehen, die beim Kauf
zugestimmt haben. Darum zwei Schritte: **erst** Einwilligung einsammeln (A), **dann**
die Mail zeitversetzt senden (B).

### Schritt A — Einwilligungs-Häkchen im Checkout aktivieren

1. **Einstellungen** → im linken Menü **„Checkout"**.
2. Runterscrollen zum Abschnitt **„Marketing-Optionen"** (bzw. „Marketing" /
   „E-Mail-Marketing"). Dort gibt es die Option, beim Bezahlen ein
   **E-Mail-Marketing-Häkchen** anzuzeigen.
3. Diese Anzeige **einschalten** (z. B. „Beim Checkout eine Anmeldeoption anzeigen").
4. **Ganz wichtig für Deutschland:** Bei **„Vorauswahl"** / „vorausgewählt" die
   Länder so einstellen, dass das Häkchen **NICHT vorausgewählt** ist (kein Häkchen
   als Standard). Seit März 2025 kann Shopify das je Land vorauswählen – für
   **Deutschland muss es leer** sein, der Kunde muss selbst anklicken.
5. **Speichern.**

> **Ehrliche Einordnung (wichtig):** Shopify beschriftet dieses Häkchen standardmäßig
> allgemein mit „E-Mail mit Neuigkeiten und Angeboten" – den genauen Text auf
> „…Bewertungsanfrage…" umzuformulieren geht im normalen Shopify **nicht frei**
> (dafür bräuchte man Shopify Plus oder eine Zusatz-App). Für den Start ist das
> allgemeine Marketing-Häkchen **ausreichend**: Wer zustimmt, darf Werbung/Reviews
> per Mail bekommen. Nur Kunden **mit** Häkchen bekommen später Mail 2.

### Schritt B — Die Bewertungsmail mit Shopify Flow zeitversetzt senden

Dafür brauchst du zwei kostenlose Apps: **Shopify Flow** (Automatisierung) und
**Shopify Email** (verschickt die Mail an Kunden). Beide sind gratis.

**B1 – Apps installieren**

1. Oben in der Shopify-Suche „**Shopify Flow**" eingeben → App öffnen → **installieren**.
2. Ebenso „**Shopify Email**" suchen → **installieren** (falls noch nicht vorhanden).

**B2 – Workflow bauen**

1. Links im Menü **„Apps"** → **„Flow"** öffnen → **„Workflow erstellen"**.
2. **Auslöser wählen** (Trigger): auf **„Auslöser hinzufügen"** klicken und
   **„Order created"** / **„Bestellung erstellt"** auswählen.
3. **Warten einbauen:** auf das **„+"** unter dem Auslöser → **„Wait"** / **„Warten"**
   wählen → **21 Tage** eintragen.
   - Grund: Bei 10–14 Werktagen Lieferzeit soll die Mail erst kommen, wenn die Ware
     wirklich da ist. Frühestens 18, besser **21 Tage**. (Flow kann bis zu 90 Tage
     warten – 21 ist also problemlos.)
4. **Mail senden:** wieder **„+"** → Aktion **„Marketing-E-Mail senden"**
   (*Send marketing email*) wählen.
   - Diese Aktion sendet **nur an Kunden, die dem E-Mail-Marketing zugestimmt haben** –
     genau das, was wir für § 7 UWG brauchen. (Kunden ohne Häkchen aus Schritt A
     bekommen die Mail automatisch nicht.)
   - Es öffnet sich ein **E-Mail-Editor** (Shopify Email). Dort **Betreff** und
     **Text** von unten einsetzen und den Button auf **https://stowestudio.de/bewertung**
     verlinken.
5. Oben dem Workflow einen Namen geben (z. B. „Bewertungsbitte 21 Tage") und rechts
   oben auf **„Aktivieren" / „Turn on"** klicken. Fertig.

**Betreff:**

```
Wie gefällt dir dein Stowe Studio Produkt?
```

**Text der Mail:**

```
Hallo,

dein Paket sollte inzwischen bei dir angekommen sein — wir hoffen, es gefällt dir und
leistet dir auf deiner nächsten Reise gute Dienste.

Wir würden uns sehr über deine ehrliche Meinung freuen. Sie hilft uns, besser zu
werden, und anderen Reisenden bei der Entscheidung. Es dauert nur eine Minute:

👉 Jetzt Produkt bewerten: https://stowestudio.de/bewertung

Vielen Dank und gute Reise! Dein Team von Stowe Studio ✈️

—
Du erhältst diese E-Mail, weil du beim Kauf einer Bewertungsanfrage zugestimmt hast.
Wenn du keine solchen E-Mails mehr erhalten möchtest, klicke unten auf „Abmelden".
```

> **Zum Vornamen:** Ich habe oben bewusst neutral **„Hallo,"** geschrieben, weil das
> immer funktioniert. Wenn du persönlich „Hallo Max," möchtest, nutze im
> Shopify-Email-Editor den Einfüge-Button für den **Vornamen** des Kunden (im Editor
> unter „Personalisieren"/„Variable einfügen"). Wenn dir das zu fummelig ist, lass
> einfach „Hallo," stehen – das ist völlig in Ordnung.

> **Abmelden:** Shopify-Marketing-Mails haben unten automatisch einen
> **Abmelde-Link** – der erfüllt die Pflicht. Wer sich abmeldet, wird von Shopify
> automatisch aus künftigen Marketing-Mails herausgenommen. Du musst nichts von Hand tun.

---

## 🔮 Später: Wenn ihr Bewertungen auf der Website zeigen wollt

Jetzt noch nichts zu tun – nur zur Vormerkung:

1. **Echtheit kennzeichnen (§ 5b Abs. 3 UWG).** Sobald du mit Bewertungen/Sternen
   wirbst, offenlegen, ob/wie du prüfst, dass sie von echten Käufern stammen. Ein
   Satz wie „Alle Bewertungen stammen von Kunden, die das Produkt bei uns gekauft
   haben" reicht – aber nur, wenn er stimmt.
2. **Nicht filtern.** Nicht nur gute Bewertungen zeigen und schlechte verschwinden
   lassen. Entweder alle oder nach einem neutralen, offengelegten Kriterium.

---

## ☑️ Deine Kurz-Checkliste

- [ ] **Schritt 0:** Absender-E-Mail (stowestudioofficial@gmail.com) bestätigt
- [ ] **Mail 1:** Begrüßungstext in der Bestellbestätigung ersetzt + Testmail geprüft
- [ ] **Schritt A:** Marketing-Häkchen im Checkout aktiviert und **nicht** vorausgewählt
- [ ] **Schritt B:** Shopify Flow + Shopify Email installiert
- [ ] **Schritt B:** Workflow „Bestellung erstellt → 21 Tage warten → Marketing-E-Mail
      senden" gebaut, Betreff/Text eingesetzt, Button auf stowestudio.de/bewertung,
      Workflow **aktiviert**
- [ ] (Optional) Selbst testen: Bestellung mit Häkchen → nach der Wartezeit prüfen
