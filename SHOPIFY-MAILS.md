# 📧 Shopify-Mails einrichten – Stowe Studio

Diese Datei enthält die **fertigen Texte** und eine **Schritt-für-Schritt-Anleitung**.
Es ist kein Code – du kopierst die Texte direkt in Shopify.

Es geht um zwei Mails:

- **Mail 1 – Dankes-Mail** direkt nach dem Kauf (unproblematisch, keine Einwilligung nötig)
- **Mail 2 – Bewertungsbitte** zeitversetzt (Werbung → nur mit Einwilligung, § 7 UWG)

---

## ✅ Mail 1 — Dankestext in der Bestellbestätigung

**Was das ist:** Die Bestätigung, die Shopify sowieso automatisch nach jedem Kauf
verschickt. Wir ergänzen oben nur einen persönlichen Dank. **Keine Bewertungsbitte**
in diese Mail – sonst wird aus der Transaktionsmail eine Werbemail (abmahnbar).

### Text zum Einfügen (oben in die Mail)

```
Vielen Dank für deine Bestellung bei Stowe Studio! 🎒

Wir freuen uns riesig, dass du mit dabei bist. Deine Bestellung wird jetzt für dich
vorbereitet und von unserem Produktionspartner verschickt. Die Lieferzeit beträgt
10–14 Werktage — sobald dein Paket unterwegs ist, bekommst du von uns eine E-Mail
mit der Sendungsnummer.

Gute Reise wünscht dir das Team von Stowe Studio ✈️
```

### Was du genau tun musst

1. Shopify Admin öffnen → **Einstellungen** (unten links) → **Benachrichtigungen**.
2. Im Bereich **Kundenbenachrichtigungen** die **„Bestellbestätigung"** anklicken.
3. Auf **„E-Mail-Vorlage bearbeiten"** (bzw. „Code bearbeiten") gehen.
4. Ganz oben im Textbereich (vor der Bestellübersicht) den Dankestext von oben einfügen.
   - Tipp: Schreib ihn als einfachen Absatz. Wenn du im HTML-Editor bist, umschließe
     jeden Absatz mit `<p>…</p>`.
5. **Wichtig:** Die bestehende **Bestellübersicht** (Artikel, Preise, Adresse) darunter
   **stehen lassen** – die ist gesetzlich Pflicht.
6. **Speichern.** Danach oben rechts auf **„Testbenachrichtigung senden"** klicken und
   in deinem Postfach prüfen, ob es gut aussieht.

---

## ✅ Mail 2 — Bewertungsbitte (zeitversetzt, nur mit Einwilligung)

Diese Mail ist Werbung. Sie darf **nur** an Kunden gehen, die beim Kauf aktiv
zugestimmt haben. Deshalb zwei Schritte: **erst** die Einwilligung einsammeln,
**dann** die Mail zeitversetzt senden.

### Schritt A — Einwilligung im Checkout einholen

**Text für die Checkbox:**

```
Ja, ich möchte nach Erhalt meiner Bestellung eine E-Mail mit der Bitte um eine
Produktbewertung erhalten. (Abmeldung jederzeit möglich.)
```

**Was du genau tun musst:**

1. Shopify Admin → **Einstellungen** → **Checkout**.
2. Runterscrollen zum Bereich **„Marketing-Zustimmung"** / **„Einwilligungen"**
   (je nach Shopify-Version: „E-Mail-Marketing" beim Checkout).
3. Die Option aktivieren, dass beim Checkout eine **Zustimmungs-Checkbox** angezeigt wird.
4. Falls du den Text anpassen kannst, den Text von oben einsetzen.
5. **Ganz wichtig:** Die Checkbox darf **NICHT vorausgewählt** sein (kein Häkchen als
   Standard). Der Kunde muss selbst anklicken.
6. **Speichern.**

> Nur Kunden mit gesetztem Häkchen dürfen Mail 2 bekommen. Alle anderen nicht.

### Schritt B — Die Bewertungsmail zeitversetzt senden (Shopify Flow)

**Text der Mail:**

```
Betreff: Wie gefällt dir dein Stowe Studio Produkt?

Hallo [Vorname],

dein Paket sollte inzwischen bei dir angekommen sein — wir hoffen, es gefällt dir und
leistet dir auf deiner nächsten Reise gute Dienste.

Wir würden uns sehr über deine ehrliche Meinung freuen. Sie hilft uns, besser zu
werden, und anderen Reisenden bei der Entscheidung. Es dauert nur eine Minute:

👉 Jetzt Produkt bewerten: https://stowestudio.de/bewertung

Vielen Dank und gute Reise! Dein Team von Stowe Studio ✈️

—
Du erhältst diese E-Mail, weil du beim Kauf einer Bewertungsanfrage zugestimmt hast.
Wenn du keine solchen E-Mails mehr erhalten möchtest, antworte einfach mit „Abmelden".
```

> **„[Vorname]"** ist ein Platzhalter. In Shopify Flow fügst du dafür die Variable
> des Kunden-Vornamens ein (in Flow heißt sie meist `{{ order.customer.firstName }}`
> oder du wählst sie über den Variablen-Einfüger aus). Wenn das zu fummelig ist,
> schreib einfach neutral **„Hallo,"** ohne Namen – das ist völlig okay.

**Was du genau tun musst:**

1. Im Shopify Admin die App **„Shopify Flow"** installieren (kostenlos, im Shopify App
   Store). Alternativ geht es auch mit **Shopify Email** + einer Automation.
2. In Flow einen neuen **Workflow** erstellen.
3. **Auslöser (Trigger):** „Order created" (Bestellung erstellt).
4. **Verzögerung (Delay) einbauen:** **21 Tage** warten.
   - Grund: Bei 10–14 Werktagen Lieferzeit soll die Mail erst rausgehen, wenn die Ware
     wirklich da ist. **Frühestens 18 Tage, besser 21.** Nie früher – sonst fragst du
     nach einer Bewertung für ein noch nicht angekommenes Produkt.
5. **Bedingung (Condition):** Nur weitermachen, wenn die **Marketing-/Bewertungs-
   Einwilligung aus Schritt A gesetzt** ist (Kunde hat dem E-Mail-Empfang zugestimmt).
   - In Flow z. B. die Bedingung auf „customer email marketing consent = subscribed"
     bzw. das entsprechende Einwilligungsfeld setzen.
6. **Aktion (Action):** „Send email" – Betreff und Text von oben einsetzen, den Button/
   Link auf **https://stowestudio.de/bewertung** zeigen lassen.
7. Workflow **aktivieren** (einschalten).

> **Abmeldungen ernst nehmen:** Der Abmelde-Hinweis am Ende der Mail ist Pflicht. Wenn
> jemand mit „Abmelden" antwortet, musst du ihn tatsächlich aus künftigen Bewertungs-
> mails herausnehmen.

---

## 🔮 Später: Wenn ihr Bewertungen auf der Website zeigen wollt

Jetzt noch nichts zu tun – nur zur Vormerkung:

1. **Echtheit kennzeichnen (§ 5b Abs. 3 UWG).** Sobald du mit Bewertungen/Sternen
   wirbst, musst du offenlegen, ob und wie du prüfst, dass sie von echten Käufern
   stammen. Ein Satz wie „Alle Bewertungen stammen von Kunden, die das Produkt bei
   uns gekauft haben" reicht – aber nur, wenn er stimmt.
2. **Nicht filtern.** Du darfst nicht nur gute Bewertungen zeigen und schlechte
   verschwinden lassen. Entweder alle oder nach einem neutralen, offengelegten
   Kriterium. Selektives Anzeigen ist abmahnbar.

---

## ☑️ Deine Kurz-Checkliste

- [ ] **Mail 1:** Bestellbestätigung um den Dankestext ergänzt + Testmail geprüft
- [ ] **Schritt A:** Einwilligungs-Checkbox im Checkout aktiviert (nicht vorausgewählt)
- [ ] **Schritt B:** Shopify Flow angelegt: Trigger „Bestellung" → 21 Tage warten →
      Bedingung „Einwilligung gesetzt" → Bewertungsmail senden → aktiviert
- [ ] Bewertungsmail-Link zeigt auf https://stowestudio.de/bewertung
- [ ] (Optional) Einmal selbst testen: Bestellung mit Häkchen → nach der Wartezeit
      prüfen, ob die Bewertungsmail kommt
