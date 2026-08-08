/*
  ============================================================
  SHOPIFY-KONFIGURATION  –  DEINE SCHALTZENTRALE
  ============================================================
  DAS IST DIE WICHTIGSTE DATEI FÜR DICH!

  Hier – und NUR hier – trägst du später deine Shopify-Daten ein.
  Solange die Felder leer sind (oder auf "" stehen), läuft die
  Seite im DEMO-MODUS: Die Buttons funktionieren, zeigen aber nur
  einen Hinweis statt einer echten Bestellung. So kannst du alles
  testen, bevor Shopify verbunden ist.

  Alle Stellen, an denen du etwas eintragen musst, sind mit
  // >>> HIER SHOPIFY-DATEN EINTRAGEN  markiert.

  Wo finde ich diese Daten? -> Siehe README.md, Abschnitt "Shopify verbinden".
  ============================================================
*/


// Wir speichern alle Einstellungen in einem Objekt namens SHOPIFY_CONFIG.
// "window." davor macht es überall auf der Seite verfügbar.
window.SHOPIFY_CONFIG = {

  /* --------------------------------------------------------
     1. DEINE SHOPIFY-DOMAIN
     --------------------------------------------------------
     Das ist die "myshopify.com"-Adresse deines Shops,
     NICHT deine schöne Wunsch-Domain.
     Beispiel: "stowe-studio.myshopify.com"
  */
  // >>> HIER SHOPIFY-DATEN EINTRAGEN
  // Hinweis: Das ist die technische "myshopify.com"-Domain deines Shops
  // (dein Anzeigename ist "Stowe Studio", die API-Domain lautet aber so):
  domain: "kin9zr-bk.myshopify.com",


  /* --------------------------------------------------------
     2. STOREFRONT-ACCESS-TOKEN
     --------------------------------------------------------
     Ein Zugangsschlüssel, den du in Shopify erstellst
     (siehe README). Er sieht ungefähr so aus:
     "1a2b3c4d5e6f7g8h9i0j..."

     Hinweis: Der Storefront-Token ist NUR zum Lesen/Kaufen
     gedacht und darf öffentlich im Code stehen – das ist bei
     Shopify so vorgesehen und sicher.
  */
  // >>> HIER SHOPIFY-DATEN EINTRAGEN
  storefrontAccessToken: "7f0b1f438b12eef85fba1faeee78e840",


  /* --------------------------------------------------------
     3. PRODUKT-IDs
     --------------------------------------------------------
     Jedes Produkt in Shopify hat eine eindeutige ID.
     Trage hier die IDs deiner beiden Produkte ein.

     Die ID sieht meist so aus (lange Zahl) oder als
     "gid://shopify/Product/1234567890" – die README erklärt,
     wo du sie findest. Beide Formate funktionieren mit dem SDK.
  */
  products: {
    // >>> HIER SHOPIFY-DATEN EINTRAGEN  (Produkt-ID des Zip-Pullovers)
    pullover: "15632196043092",

    // >>> HIER SHOPIFY-DATEN EINTRAGEN  (Produkt-ID des Nackenkissens)
    nackenkissen: "15633160733012"
  },


  /* --------------------------------------------------------
     4. ANZEIGE-PREISE (nur für den DEMO-MODUS)
     --------------------------------------------------------
     Diese Preise werden NUR benutzt, solange Shopify noch nicht
     verbunden ist – damit der Demo-Warenkorb eine Summe anzeigen
     kann. Sobald Shopify verbunden ist, kommen die echten Preise
     automatisch von Shopify. Passe die Zahlen ruhig an.
     (Wert in Euro, als Zahl.)
  */
  demoPreise: {
    pullover: 49.90,
    nackenkissen: 19.90
  }

};


/*
  ------------------------------------------------------------
  HILFS-FUNKTION: Ist Shopify schon konfiguriert?
  ------------------------------------------------------------
  Diese Funktion prüft, ob du alle Pflichtfelder ausgefüllt hast.
  Das JavaScript (main.js) nutzt sie, um zu entscheiden, ob der
  echte Shopify-Modus oder der Demo-Modus laufen soll.
  Du musst hier nichts ändern.
*/
window.isShopifyConfigured = function () {
  var c = window.SHOPIFY_CONFIG;
  return (
    c.domain.trim() !== "" &&
    c.storefrontAccessToken.trim() !== "" &&
    c.products.pullover.trim() !== "" &&
    c.products.nackenkissen.trim() !== ""
  );
};
