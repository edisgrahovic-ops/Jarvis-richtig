// ============================================================================
//  ALLE TEXTE UND PRODUKTDATEN AN EINEM ORT
// ----------------------------------------------------------------------------
//  Das ist DEINE Datei zum Bearbeiten. Hier stehen alle deutschen Texte,
//  Preise, Farben und Größen. Du kannst gefahrlos Wörter ändern – solange du
//  die Anführungszeichen "..." und die Kommas stehen lässt, bleibt alles heil.
//
//  Tipp: Texte in Backticks (`...`) dürfen über mehrere Zeilen gehen und
//  enthalten HTML (z. B. <p> für einen Absatz, <strong> für Fettdruck).
// ============================================================================

// ----------------------------------------------------------------------------
//  1) DEIN PRODUKT: Backpack Hoodie
// ----------------------------------------------------------------------------
export const produkt = {
  titel: "Backpack Hoodie",
  marke: "Stowe Studio",
  produktTyp: "Hoodie",

  // Diese Schlagworte helfen später bei Filtern und interner Suche.
  tags: ["Reise", "Hoodie", "Rucksack", "2-in-1", "Unisex"],

  // Der Preis GILT FÜR ALLE VARIANTEN. Punkt statt Komma verwenden (Shopify-Format).
  preis: "49.90",

  // Die ausführliche Produktbeschreibung (HTML erlaubt).
  beschreibungHtml: `
    <p><strong>Ein Kleidungsstück. Zwei Funktionen.</strong> Der Backpack Hoodie
    von Stowe Studio ist ein hochwertiger Zip-Pullover mit vollständig
    integriertem Rucksack – gemacht für Menschen, die unterwegs sind.</p>

    <p>Ob am Flughafen, im Zug oder auf dem Weg zum Wochenendtrip: Wenn du die
    Hände frei brauchst, trägst du den Hoodie ganz normal. Wenn du Platz
    brauchst, entfaltest du in Sekunden den mitgeführten Rucksack – ohne extra
    Tasche, ohne Kompromisse.</p>

    <ul>
      <li><strong>2-in-1:</strong> Hochwertiger Zip-Hoodie mit integriertem, faltbarem Rucksack.</li>
      <li><strong>Reisetauglich:</strong> Leicht, knitterarm und angenehm auf der Haut.</li>
      <li><strong>Durchdacht:</strong> Sicherer Verschluss, angenehme Träger, alltagstauglicher Schnitt.</li>
      <li><strong>Unisex:</strong> Passt zu jedem Look – von der Stadt bis zum Terminal.</li>
    </ul>

    <p>Reisen soll leicht sein. Der Backpack Hoodie nimmt dir eine Sache ab,
    an die du sonst denken müsstest.</p>
  `,

  // Die Optionen deines Produkts. WICHTIG: Die erste Farbe und die erste
  // Größe bilden zusammen die "Standard-Variante", die Shopify automatisch
  // anlegt. Das Skript kümmert sich um den Rest.
  optionen: {
    farben: ["Grau", "Schwarz"],
    groessen: ["S", "M", "L", "XL"],
  },

  // Präfix für die automatisch erzeugten Artikelnummern (SKU).
  // Beispiel-Ergebnis: STOWE-BPH-GRAU-M
  skuPraefix: "STOWE-BPH",

  // Soll Shopify den Lagerbestand mitzählen? true = ja (Startwert 0 Stück).
  lagerbestandVerfolgen: true,
};

// ----------------------------------------------------------------------------
//  2) INHALTS-SEITEN (werden als sichtbare Seiten angelegt)
// ----------------------------------------------------------------------------
//  handle  = die Adresse der Seite (z. B. stowestudio.de/pages/ueber-uns)
//  titel   = Überschrift / Menüname
//  html    = der eigentliche Inhalt (HTML erlaubt)
export const inhaltsSeiten = [
  {
    handle: "startseite-inhalt",
    titel: "Willkommen bei Stowe Studio",
    html: `
      <p><strong>Reisen soll leicht sein – im wahrsten Sinne.</strong></p>
      <p>Stowe Studio steht für durchdachte Reisebegleiter, die mehr können,
      als gut auszusehen. Unser erstes Produkt, der <strong>Backpack Hoodie</strong>,
      ist Pullover und Rucksack in einem – für alle, die mit leichtem Gepäck
      unterwegs sein wollen.</p>
      <p>Hochwertige Materialien, klare Formen, echte Funktion. Willkommen.</p>
    `,
  },
  {
    handle: "ueber-uns",
    titel: "Über uns",
    html: `
      <p>Stowe Studio ist aus einer einfachen Beobachtung entstanden: Auf
      Reisen hat man selten eine Hand frei – und nie genug Platz.</p>
      <p>Also haben wir ein Kleidungsstück entwickelt, das beides löst: einen
      hochwertigen Zip-Hoodie mit integriertem Rucksack. Kein zusätzliches
      Gepäckstück, keine unnötigen Extras – nur ein durchdachtes Stück, das
      dich begleitet.</p>
      <p>Wir glauben an Qualität statt Masse, an Funktion statt Effekthascherei
      und an Produkte, die man wirklich benutzt. Danke, dass du Teil davon bist.</p>
    `,
  },
  {
    handle: "faq",
    titel: "Häufige Fragen (FAQ)",
    html: `
      <h3>Wie funktioniert der integrierte Rucksack?</h3>
      <p>Der Rucksack ist platzsparend im Hoodie verstaut und lässt sich in
      wenigen Sekunden entfalten. Brauchst du ihn nicht, trägst du den Hoodie
      ganz normal.</p>

      <h3>Welche Größen gibt es?</h3>
      <p>Den Backpack Hoodie gibt es in den Größen S, M, L und XL sowie in den
      Farben Grau und Schwarz.</p>

      <h3>Wie pflege ich den Hoodie?</h3>
      <p>Wir empfehlen eine schonende Wäsche bei niedriger Temperatur. Die
      genauen Pflegehinweise findest du am eingenähten Etikett.</p>

      <h3>Wie lange dauert der Versand?</h3>
      <p>Bitte trage hier deine tatsächlichen Versandzeiten und -kosten ein,
      sobald sie feststehen.</p>

      <h3>Kann ich umtauschen oder zurückgeben?</h3>
      <p>Ja. Die Details regelt dein Widerrufsrecht – siehe die Seite
      „Widerruf“. (Bitte durch echte, geprüfte Angaben ersetzen.)</p>
    `,
  },
  {
    handle: "kontakt",
    titel: "Kontakt",
    html: `
      <p>Du hast eine Frage zu deiner Bestellung oder zum Backpack Hoodie?
      Wir helfen gern.</p>
      <p><strong>E-Mail:</strong> hallo@stowestudio.de<br>
      <em>(Bitte durch deine echte Kontaktadresse ersetzen.)</em></p>
      <p>Wir antworten in der Regel innerhalb von 1–2 Werktagen.</p>
    `,
  },
];

// ----------------------------------------------------------------------------
//  3) RECHTSTEXTE (nur Platzhalter, als ENTWURF, klar gekennzeichnet)
// ----------------------------------------------------------------------------
//  ACHTUNG: Das sind KEINE gültigen Rechtstexte. Sie müssen vor dem
//  Verkaufsstart durch echte, juristisch geprüfte Texte ersetzt werden.
export const rechtsSeiten = [
  { handle: "impressum",  titel: "Impressum",  thema: "Impressum" },
  { handle: "datenschutz", titel: "Datenschutzerklärung", thema: "Datenschutzerklärung" },
  { handle: "agb",        titel: "AGB",        thema: "Allgemeine Geschäftsbedingungen (AGB)" },
  { handle: "widerruf",   titel: "Widerrufsbelehrung", thema: "Widerrufsbelehrung" },
];

// Dieser Warnhinweis wird OBEN in jede Rechtstext-Seite eingebaut.
export function rechtstextPlatzhalter(thema) {
  return `
    <div style="border:2px solid #c0392b;padding:16px;border-radius:8px;background:#fdecea;">
      <p style="margin:0;"><strong>⚠️ PLATZHALTER – NOCH NICHT VERÖFFENTLICHEN</strong></p>
      <p style="margin:8px 0 0;">Dies ist ein automatisch erzeugter Platzhalter für
      deine <strong>${thema}</strong>. Er ist <strong>rechtlich nicht gültig</strong>.</p>
      <p style="margin:8px 0 0;">Bitte ersetze diesen Text vollständig durch einen
      echten, geprüften Rechtstext – zum Beispiel von einem Anwalt oder einem
      seriösen Rechtstexte-Generator. Erst danach solltest du die Seite
      veröffentlichen.</p>
    </div>
    <p>&nbsp;</p>
    <p><em>Hier folgt später dein geprüfter Text zur ${thema}.</em></p>
  `;
}

// ----------------------------------------------------------------------------
//  4) NAVIGATIONS-VORSCHLAG (wird nur am Ende ausgegeben, NICHT per API angelegt)
// ----------------------------------------------------------------------------
export const navigationsVorschlag = {
  hauptmenue: [
    { titel: "Start", ziel: "/" },
    { titel: "Backpack Hoodie", ziel: "/products/backpack-hoodie" },
    { titel: "Über uns", ziel: "/pages/ueber-uns" },
    { titel: "FAQ", ziel: "/pages/faq" },
    { titel: "Kontakt", ziel: "/pages/kontakt" },
  ],
  fussmenue: [
    { titel: "Impressum", ziel: "/pages/impressum" },
    { titel: "Datenschutz", ziel: "/pages/datenschutz" },
    { titel: "AGB", ziel: "/pages/agb" },
    { titel: "Widerruf", ziel: "/pages/widerruf" },
  ],
};
