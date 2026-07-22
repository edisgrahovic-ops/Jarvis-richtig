/*
  ============================================================
  STOWE STUDIO – main.js (Das "Verhalten" der Seite)
  ============================================================
  Diese Datei steuert alles, was sich bewegt oder reagiert:
    - Handy-Menü öffnen/schließen
    - Warenkorb öffnen, füllen, zählen, Menge ändern
    - "In den Warenkorb"-Buttons
    - Farb-/Größenauswahl beim Pullover
    - FAQ (macht die <details> weich)
    - Fade-in-Animationen beim Scrollen
    - Shopify-Anbindung (echt) ODER Demo-Modus (wenn keine Daten)

  Für Anfänger:
  Der ganze Code läuft erst los, wenn die Seite fertig geladen ist
  (siehe ganz unten: "DOMContentLoaded"). Vorher definieren wir nur
  Funktionen – wie Werkzeuge, die bereitliegen.
  ============================================================
*/


/* ============================================================
   TEIL A: PRODUKT-STAMMDATEN
   ------------------------------------------------------------
   Namen und Demo-Preise unserer Produkte an einem Ort.
   Die Preise kommen aus der Konfigurationsdatei (Demo-Modus).
   ============================================================ */
var PRODUKTE = {
  pullover: {
    name: "Zip-Pullover mit Rucksack",
    preis: window.SHOPIFY_CONFIG.demoPreise.pullover
  },
  nackenkissen: {
    name: "Nackenkissen mit Stauraum",
    preis: window.SHOPIFY_CONFIG.demoPreise.nackenkissen
  }
};


/* ============================================================
   TEIL B: DER WARENKORB (im Demo-Modus)
   ------------------------------------------------------------
   Wir speichern die Artikel in einer einfachen Liste (Array).
   Jeder Eintrag: { key, produkt, name, variante, preis, menge }
   "key" ist eine eindeutige Kennung, damit z. B. Pullover in Grau/S
   und Pullover in Schwarz/M getrennt gezählt werden.

   Hinweis: Sobald Shopify verbunden ist, übernimmt das Shopify-SDK
   den echten Warenkorb. Dieser Demo-Warenkorb dient nur zum Testen.
   ============================================================ */
var warenkorb = [];


/* ------------------------------------------------------------
   Kleine Helfer-Funktion: Preis schön als Euro anzeigen
   z. B. 89 -> "89,00 €"
   ------------------------------------------------------------ */
function formatiereEuro(betrag) {
  return betrag.toFixed(2).replace(".", ",") + " €";
}


/* ------------------------------------------------------------
   Toast anzeigen: kleine Hinweis-Box unten am Bildschirm
   ------------------------------------------------------------ */
var toastTimer = null;
function zeigeToast(text) {
  var toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("is-visible");

  // Nach 3 Sekunden wieder ausblenden.
  // (Vorherigen Timer löschen, falls schnell hintereinander geklickt wird.)
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 3000);
}


/* ------------------------------------------------------------
   Artikel zum Warenkorb hinzufügen
   ------------------------------------------------------------ */
function fuegeZumWarenkorbHinzu(produktKey, variante) {
  var produkt = PRODUKTE[produktKey];

  // Eindeutiger Schlüssel aus Produkt + Variante (Farbe/Größe)
  var key = produktKey + "|" + (variante || "standard");

  // Schauen, ob dieser Artikel (gleiche Variante) schon drin ist
  var vorhanden = warenkorb.find(function (item) {
    return item.key === key;
  });

  if (vorhanden) {
    // Schon vorhanden -> nur Menge erhöhen
    vorhanden.menge += 1;
  } else {
    // Neu -> als neuen Eintrag anlegen
    warenkorb.push({
      key: key,
      produkt: produktKey,
      name: produkt.name,
      variante: variante || "",
      preis: produkt.preis,
      menge: 1
    });
  }

  aktualisiereWarenkorbAnzeige();
  zeigeToast("„" + produkt.name + "“ wurde hinzugefügt");
}


/* ------------------------------------------------------------
   Menge eines Artikels ändern (+1 oder -1)
   Sinkt die Menge auf 0, wird der Artikel entfernt.
   ------------------------------------------------------------ */
function aendereMenge(key, differenz) {
  var item = warenkorb.find(function (i) { return i.key === key; });
  if (!item) return;

  item.menge += differenz;
  if (item.menge <= 0) {
    entferneArtikel(key);
  } else {
    aktualisiereWarenkorbAnzeige();
  }
}


/* ------------------------------------------------------------
   Artikel komplett entfernen
   ------------------------------------------------------------ */
function entferneArtikel(key) {
  warenkorb = warenkorb.filter(function (i) { return i.key !== key; });
  aktualisiereWarenkorbAnzeige();
}


/* ------------------------------------------------------------
   Die Warenkorb-Anzeige neu aufbauen
   (Zähler oben, Liste im Drawer, Summe)
   ------------------------------------------------------------ */
function aktualisiereWarenkorbAnzeige() {
  var itemsContainer = document.getElementById("cart-items");
  var emptyHinweis = document.getElementById("cart-empty");
  var countBadge = document.getElementById("cart-count");
  var totalEl = document.getElementById("cart-total");

  // 1) Gesamt-Anzahl und Gesamt-Summe berechnen
  var gesamtAnzahl = 0;
  var gesamtSumme = 0;
  warenkorb.forEach(function (item) {
    gesamtAnzahl += item.menge;
    gesamtSumme += item.menge * item.preis;
  });

  // 2) Zähler oben am Warenkorb-Symbol aktualisieren
  countBadge.textContent = gesamtAnzahl;
  if (gesamtAnzahl > 0) {
    countBadge.classList.add("is-visible");
  } else {
    countBadge.classList.remove("is-visible");
  }

  // 3) Summe anzeigen
  totalEl.textContent = formatiereEuro(gesamtSumme);

  // 4) Leeren-Hinweis ein-/ausblenden
  emptyHinweis.style.display = warenkorb.length === 0 ? "block" : "none";

  // 5) Die Artikel-Liste neu aufbauen
  itemsContainer.innerHTML = "";  // erst leeren
  warenkorb.forEach(function (item) {
    // Ein DIV pro Artikel erstellen
    var el = document.createElement("div");
    el.className = "cart-item";

    // Varianten-Text (nur anzeigen, wenn vorhanden)
    var variantenZeile = item.variante
      ? '<div class="cart-item__variant">' + item.variante + "</div>"
      : "";

    // Das Innere per HTML zusammenbauen
    el.innerHTML =
      '<div class="cart-item__info">' +
        '<div class="cart-item__name">' + item.name + "</div>" +
        variantenZeile +
        '<div class="cart-item__qty">' +
          '<button type="button" data-minus="' + item.key + '" aria-label="Weniger">−</button>' +
          "<span>" + item.menge + "</span>" +
          '<button type="button" data-plus="' + item.key + '" aria-label="Mehr">+</button>' +
        "</div>" +
        '<button type="button" class="cart-item__remove" data-remove="' + item.key + '">Entfernen</button>' +
      "</div>" +
      '<div class="cart-item__price">' + formatiereEuro(item.menge * item.preis) + "</div>";

    itemsContainer.appendChild(el);
  });
}


/* ------------------------------------------------------------
   Warenkorb öffnen / schließen (der Drawer von rechts)
   ------------------------------------------------------------ */
function oeffneWarenkorb() {
  document.getElementById("cart-drawer").classList.add("is-open");
  document.getElementById("cart-overlay").classList.add("is-open");
  document.getElementById("cart-drawer").setAttribute("aria-hidden", "false");
}
function schliesseWarenkorb() {
  document.getElementById("cart-drawer").classList.remove("is-open");
  document.getElementById("cart-overlay").classList.remove("is-open");
  document.getElementById("cart-drawer").setAttribute("aria-hidden", "true");
}


/* ============================================================
   TEIL C: SHOPIFY-ANBINDUNG
   ------------------------------------------------------------
   Wenn du in shopify-config.js deine Daten eingetragen hast,
   lädt diese Funktion das offizielle Shopify Buy SDK und
   erstellt einen echten Warenkorb (Checkout).

   Solange keine Daten da sind, passiert hier nichts und die
   Seite bleibt im Demo-Modus.
   ============================================================ */

// Diese Variablen halten später die Shopify-Objekte.
var shopifyClient = null;     // Verbindung zu deinem Shop
var shopifyCheckout = null;   // Der echte Warenkorb bei Shopify

/*
  Lädt das Shopify Buy SDK (ein externes Skript) nach.
  "callback" wird ausgeführt, sobald das Skript bereit ist.
*/
function ladeShopifySDK(callback) {
  // Falls schon geladen, direkt weiter
  if (window.ShopifyBuy) {
    callback();
    return;
  }
  var script = document.createElement("script");
  script.src = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
  script.async = true;
  script.onload = callback;
  script.onerror = function () {
    console.warn("Shopify SDK konnte nicht geladen werden. Seite läuft im Demo-Modus.");
  };
  document.head.appendChild(script);
}

/*
  Baut die Verbindung zu Shopify auf und legt einen leeren
  Checkout (Warenkorb) an.
*/
function initShopify() {
  var c = window.SHOPIFY_CONFIG;

  // Client (Verbindung) erstellen
  shopifyClient = window.ShopifyBuy.buildClient({
    domain: c.domain,
    storefrontAccessToken: c.storefrontAccessToken
  });

  // Die echten Preise direkt aus Shopify laden und in den Produktkarten anzeigen
  ladeLivePreise();

  // Einen neuen, leeren Warenkorb bei Shopify anlegen
  shopifyClient.checkout.create().then(function (checkout) {
    shopifyCheckout = checkout;
    rendereShopifyWarenkorb();   // Anzeige auf den (leeren) Shopify-Warenkorb setzen
  });
}

/*
  Fügt bei ECHTEM Shopify-Betrieb einen Artikel zum Checkout hinzu.
  Wir brauchen dafür die "Variant-ID" der gewählten Farbe/Größe.

  WICHTIG: Damit Farbe/Größe korrekt zugeordnet werden, müssen die
  Optionswerte in Shopify exakt "Grau/Schwarz" bzw. "S/M/L/XL" heißen.
  Details dazu stehen in der README.
*/
function shopifyAddToCart(produktKey, varianteText) {
  var c = window.SHOPIFY_CONFIG;
  var produktId = c.products[produktKey];

  // Falls nur die reine Zahl eingetragen wurde (z. B. "15632196043092"),
  // wandeln wir sie ins von Shopify erwartete Format ("gid://...") um.
  if (/^\d+$/.test(produktId)) {
    produktId = "gid://shopify/Product/" + produktId;
  }

  // Produkt bei Shopify abrufen, passende Variante finden und hinzufügen
  shopifyClient.product.fetch(produktId).then(function (product) {
    var variantId = product.variants[0].id;  // Standard: erste Variante

    // Wenn eine Variante (Farbe/Größe) gewählt wurde, passende suchen
    if (varianteText) {
      var teile = varianteText.split(" / ");  // z. B. "Grau / S"
      var passende = product.variants.find(function (v) {
        // Alle Optionswerte der Variante mit unserer Auswahl vergleichen
        return v.selectedOptions.every(function (opt) {
          return teile.indexOf(opt.value) !== -1;
        });
      });
      if (passende) variantId = passende.id;
    }

    // Artikel zum Shopify-Checkout hinzufügen
    var lineItems = [{ variantId: variantId, quantity: 1 }];
    return shopifyClient.checkout.addLineItems(shopifyCheckout.id, lineItems);
  }).then(function (checkout) {
    shopifyCheckout = checkout;
    rendereShopifyWarenkorb();   // Warenkorb-Anzeige mit echten Daten füllen
    zeigeToast("Zum Warenkorb hinzugefügt");
  }).catch(function (err) {
    console.error("Shopify-Fehler:", err);
    zeigeToast("Es gab ein Problem. Bitte später erneut versuchen.");
  });
}


/*
  Holt die echten Preise aus Shopify und zeigt sie in den Produktkarten an.
  So stimmt der angezeigte Preis immer mit Shopify überein – du musst ihn
  nie wieder von Hand ändern. Wenn ein Produkt mehrere Preise hat
  (z. B. je Größe), zeigen wir "ab X €".
*/
function ladeLivePreise() {
  var c = window.SHOPIFY_CONFIG;
  Object.keys(c.products).forEach(function (key) {
    var id = c.products[key];
    if (!id) return;
    if (/^\d+$/.test(id)) id = "gid://shopify/Product/" + id;

    shopifyClient.product.fetch(id).then(function (product) {
      var karte = document.querySelector('.product-card[data-product="' + key + '"]');
      if (!karte) return;
      var preisEl = karte.querySelector(".product-card__price-now");
      if (!preisEl) return;

      // Günstigsten und teuersten Variantenpreis bestimmen
      var preise = product.variants.map(function (v) {
        return betragAusPreis(v.priceV2 || v.price);
      });
      var min = Math.min.apply(null, preise);
      var max = Math.max.apply(null, preise);

      preisEl.textContent = (min !== max ? "ab " : "") + formatiereEuro(min);
    }).catch(function (err) {
      // Klappt es nicht (z. B. offline), bleibt einfach der Platzhalter stehen.
      console.warn("Preis konnte nicht aus Shopify geladen werden:", err);
    });
  });
}

/*
  Kleiner Helfer: holt den Zahlen-Betrag aus einem Shopify-Preis.
  Shopify liefert Preise mal als Text ("89.00"), mal als Objekt
  ({ amount: "89.00", currencyCode: "EUR" }). Das fangen wir hier ab.
*/
function betragAusPreis(preis) {
  if (preis == null) return 0;
  if (typeof preis === "object") return parseFloat(preis.amount || 0);
  return parseFloat(preis) || 0;
}

/*
  Baut die Warenkorb-Anzeige (Zähler, Liste, Summe) aus dem ECHTEN
  Shopify-Warenkorb auf. Wird nach jeder Änderung aufgerufen.
*/
function rendereShopifyWarenkorb() {
  var itemsContainer = document.getElementById("cart-items");
  var emptyHinweis = document.getElementById("cart-empty");
  var countBadge = document.getElementById("cart-count");
  var totalEl = document.getElementById("cart-total");

  var lineItems = (shopifyCheckout && shopifyCheckout.lineItems) ? shopifyCheckout.lineItems : [];

  // Anzahl gesamt
  var anzahl = 0;
  lineItems.forEach(function (li) { anzahl += li.quantity; });
  countBadge.textContent = anzahl;
  countBadge.classList.toggle("is-visible", anzahl > 0);

  // Zwischensumme: bevorzugt direkt von Shopify, sonst selbst berechnen
  var summe = betragAusPreis(shopifyCheckout && (shopifyCheckout.subtotalPriceV2 || shopifyCheckout.subtotalPrice));
  if (!summe) {
    lineItems.forEach(function (li) {
      summe += li.quantity * betragAusPreis(li.variant && (li.variant.priceV2 || li.variant.price));
    });
  }
  totalEl.textContent = formatiereEuro(summe);

  // Leeren-Hinweis
  emptyHinweis.style.display = lineItems.length === 0 ? "block" : "none";

  // Liste aufbauen
  itemsContainer.innerHTML = "";
  lineItems.forEach(function (li) {
    var el = document.createElement("div");
    el.className = "cart-item";

    // Variante (z. B. "Grau / S"); "Default Title" bei Produkten ohne Optionen ausblenden
    var variante = (li.variant && li.variant.title && li.variant.title !== "Default Title") ? li.variant.title : "";
    var variantenZeile = variante ? '<div class="cart-item__variant">' + variante + "</div>" : "";
    var einzelpreis = betragAusPreis(li.variant && (li.variant.priceV2 || li.variant.price));

    el.innerHTML =
      '<div class="cart-item__info">' +
        '<div class="cart-item__name">' + li.title + "</div>" +
        variantenZeile +
        '<div class="cart-item__qty">' +
          '<button type="button" data-minus="' + li.id + '" aria-label="Weniger">−</button>' +
          "<span>" + li.quantity + "</span>" +
          '<button type="button" data-plus="' + li.id + '" aria-label="Mehr">+</button>' +
        "</div>" +
        '<button type="button" class="cart-item__remove" data-remove="' + li.id + '">Entfernen</button>' +
      "</div>" +
      '<div class="cart-item__price">' + formatiereEuro(li.quantity * einzelpreis) + "</div>";

    itemsContainer.appendChild(el);
  });
}

/*
  Ändert die Menge eines Artikels im ECHTEN Shopify-Warenkorb.
  Bei Menge 0 wird der Artikel entfernt.
*/
function shopifyAendereMenge(lineItemId, neueMenge) {
  var anfrage;
  if (neueMenge <= 0) {
    anfrage = shopifyClient.checkout.removeLineItems(shopifyCheckout.id, [lineItemId]);
  } else {
    anfrage = shopifyClient.checkout.updateLineItems(shopifyCheckout.id, [{ id: lineItemId, quantity: neueMenge }]);
  }
  anfrage.then(function (checkout) {
    shopifyCheckout = checkout;
    rendereShopifyWarenkorb();
  }).catch(function (err) {
    console.error("Shopify-Fehler:", err);
    zeigeToast("Es gab ein Problem beim Aktualisieren.");
  });
}


/* ============================================================
   TEIL D: CHECKOUT (Zur Kasse)
   ------------------------------------------------------------
   Echt-Modus: leitet zur sicheren Shopify-Bezahlseite weiter.
   Demo-Modus: zeigt nur einen Hinweis.
   ============================================================ */
function geheZurKasse() {
  if (window.isShopifyConfigured() && shopifyCheckout) {
    // Echter Checkout: Shopify-Bezahlseite in neuem Tab öffnen
    window.open(shopifyCheckout.webUrl, "_blank");
  } else {
    // Demo-Modus
    zeigeToast("Demo-Modus: Trage in shopify-config.js deine Shopify-Daten ein, um zu bestellen.");
  }
}


/* ============================================================
   TEIL E: FADE-IN-ANIMATIONEN BEIM SCROLLEN
   ------------------------------------------------------------
   Wir beobachten alle Elemente mit der Klasse "reveal".
   Sobald eines in den sichtbaren Bereich scrollt, bekommt es
   die Klasse "is-visible" und faded sanft ein (siehe CSS).
   ============================================================ */
function initScrollAnimationen() {
  var elemente = document.querySelectorAll(".reveal");

  // Fallback: Wenn der Browser IntersectionObserver nicht kann,
  // einfach alles sofort sichtbar machen.
  if (!("IntersectionObserver" in window)) {
    elemente.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (eintrag) {
      if (eintrag.isIntersecting) {
        eintrag.target.classList.add("is-visible");
        beobachter.unobserve(eintrag.target);  // Nur einmal animieren
      }
    });
  }, {
    threshold: 0.12   // Auslösen, wenn ~12 % des Elements sichtbar sind
  });

  elemente.forEach(function (el) { beobachter.observe(el); });
}


/* ============================================================
   TEIL F: PRODUKT-OPTIONEN (Farbe / Größe auswählen)
   ------------------------------------------------------------
   Beim Klick auf einen Chip wird dieser aktiv, die anderen in
   derselben Gruppe werden inaktiv.
   ============================================================ */
function initOptionsAuswahl() {
  var gruppen = document.querySelectorAll(".option__choices");
  gruppen.forEach(function (gruppe) {
    gruppe.addEventListener("click", function (e) {
      // Nur reagieren, wenn ein Chip (Button) geklickt wurde
      if (!e.target.classList.contains("chip")) return;

      // Alle Chips in dieser Gruppe zurücksetzen ...
      gruppe.querySelectorAll(".chip").forEach(function (chip) {
        chip.classList.remove("is-active");
      });
      // ... und den geklickten aktiv setzen
      e.target.classList.add("is-active");
    });
  });
}

/*
  Liest die aktuell gewählte Variante einer Produktkarte aus.
  Ergebnis z. B. "Grau / S" – oder "" wenn keine Optionen da sind.
*/
function leseVariante(produktKarte) {
  var werte = [];
  var gruppen = produktKarte.querySelectorAll(".option__choices");
  gruppen.forEach(function (gruppe) {
    var aktiv = gruppe.querySelector(".chip.is-active");
    if (aktiv) werte.push(aktiv.getAttribute("data-value"));
  });
  return werte.join(" / ");
}


/* ============================================================
   TEIL G: HANDY-MENÜ
   ============================================================ */
function initHandyMenu() {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");

  toggle.addEventListener("click", function () {
    var offen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", offen);
    toggle.setAttribute("aria-expanded", offen ? "true" : "false");
  });

  // Menü schließen, wenn ein Link angeklickt wird
  nav.querySelectorAll(".nav__link").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}


/* ============================================================
   TEIL H: ALLES STARTEN
   ------------------------------------------------------------
   "DOMContentLoaded" bedeutet: warte, bis die Seite geladen ist,
   und führe dann diesen Code aus. Hier verbinden wir alle Buttons
   mit ihren Funktionen ("Event Listener").
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {

  // 0) Bild-Fallback: Falls ein Foto (z. B. pullover-1.jpg) noch fehlt,
  //    zeigen wir automatisch die neutrale Platzhalter-Grafik an.
  //    So gibt es niemals ein "kaputtes Bild"-Symbol.
  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () {
      // Endlosschleife vermeiden: nur einmal auf den Platzhalter wechseln
      if (img.getAttribute("data-fallback") === "true") return;
      img.setAttribute("data-fallback", "true");
      img.src = "images/platzhalter.svg";
    });
  });

  // 1) Prüfen, ob Shopify konfiguriert ist -> ggf. SDK laden
  if (window.isShopifyConfigured()) {
    ladeShopifySDK(initShopify);
    console.log("Stowe Studio: Shopify-Modus aktiv.");
  } else {
    console.log("Stowe Studio: DEMO-MODUS aktiv. Trage deine Daten in js/shopify-config.js ein.");
  }

  // 2) Animationen, Optionen und Menü aktivieren
  initScrollAnimationen();
  initOptionsAuswahl();
  initHandyMenu();

  // 3) "In den Warenkorb"-Buttons verbinden
  document.querySelectorAll(".add-to-cart").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var produktKey = btn.getAttribute("data-product");
      var karte = btn.closest(".product-card");
      var variante = leseVariante(karte);

      if (window.isShopifyConfigured()) {
        // Echter Shopify-Warenkorb
        shopifyAddToCart(produktKey, variante);
      } else {
        // Demo-Warenkorb
        fuegeZumWarenkorbHinzu(produktKey, variante);
      }
      // Warenkorb öffnen, damit man das Ergebnis sieht
      oeffneWarenkorb();
    });
  });

  // 4) Warenkorb öffnen/schließen
  document.getElementById("cart-btn").addEventListener("click", oeffneWarenkorb);
  document.getElementById("cart-close").addEventListener("click", schliesseWarenkorb);
  document.getElementById("cart-overlay").addEventListener("click", schliesseWarenkorb);

  // 5) Checkout-Button
  document.getElementById("checkout-btn").addEventListener("click", geheZurKasse);

  // 6) Klicks INNERHALB der Artikel-Liste (Menge +/- und Entfernen)
  //    Wir hören auf den Container und prüfen, was geklickt wurde.
  //    Je nach Modus (Shopify oder Demo) rufen wir die passenden Funktionen.
  document.getElementById("cart-items").addEventListener("click", function (e) {
    var plus = e.target.getAttribute("data-plus");
    var minus = e.target.getAttribute("data-minus");
    var remove = e.target.getAttribute("data-remove");

    if (window.isShopifyConfigured() && shopifyCheckout) {
      // ---- ECHTER Shopify-Warenkorb ----
      // Aktuelle Menge des betroffenen Artikels heraussuchen
      var id = plus || minus || remove;
      var li = shopifyCheckout.lineItems.find(function (x) { return x.id === id; });
      if (!li) return;

      if (plus)   shopifyAendereMenge(id, li.quantity + 1);
      if (minus)  shopifyAendereMenge(id, li.quantity - 1);
      if (remove) shopifyAendereMenge(id, 0);
    } else {
      // ---- DEMO-Warenkorb ----
      if (plus) aendereMenge(plus, +1);
      if (minus) aendereMenge(minus, -1);
      if (remove) entferneArtikel(remove);
    }
  });

  // 7) Warenkorb mit der Taste "Escape" schließen (kleine Komfort-Funktion)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") schliesseWarenkorb();
  });

  // Startzustand der Warenkorb-Anzeige setzen
  aktualisiereWarenkorbAnzeige();
});
