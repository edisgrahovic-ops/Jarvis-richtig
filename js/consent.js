/*
  ============================================================
  STOWE STUDIO – Cookie-Consent (Einwilligung)
  ============================================================
  Was macht diese Datei?
  Sie steuert das Cookie-Banner und merkt sich die Entscheidung
  des Besuchers. Erst NACH einer Zustimmung dürfen nicht
  notwendige Skripte (Statistik/Marketing) geladen werden –
  das ist in Deutschland Pflicht (TDDDG/DSGVO).

  So funktioniert die "Consent-Sperre" für Skripte:
  Ein Statistik-/Marketing-Skript wird NICHT normal eingebunden,
  sondern so:

     <script type="text/plain" data-consent="marketing">
       // z. B. Meta Pixel Code
     </script>

  "type=text/plain" sorgt dafür, dass der Browser es NICHT
  ausführt. Erst wenn der Besucher "Marketing" erlaubt, wandelt
  diese Datei es in ein echtes, laufendes Skript um.

  Die Entscheidung speichern wir lokal im Browser (localStorage)
  zusammen mit Zeitpunkt und Version. Ändert sich die Version
  (z. B. neue Dienste), fragen wir erneut.
  ============================================================
*/

(function () {
  'use strict';

  // Schlüssel + Version. Bei wichtigen Änderungen Version erhöhen,
  // dann wird die Einwilligung neu abgefragt.
  var SPEICHER_KEY = 'stowe_consent';
  var VERSION = 1;

  // ---- Speichern / Laden -------------------------------------------------

  function ladeEntscheidung() {
    try {
      var roh = localStorage.getItem(SPEICHER_KEY);
      if (!roh) return null;
      var daten = JSON.parse(roh);
      // Bei alter Version neu fragen
      if (daten.version !== VERSION) return null;
      return daten;
    } catch (e) {
      return null;
    }
  }

  function speichereEntscheidung(statistik, marketing) {
    var daten = {
      version: VERSION,
      zeitpunkt: new Date().toISOString(),
      notwendig: true,          // immer an
      statistik: !!statistik,
      marketing: !!marketing
    };
    try {
      localStorage.setItem(SPEICHER_KEY, JSON.stringify(daten));
    } catch (e) { /* localStorage evtl. gesperrt – dann eben nicht speichern */ }
    return daten;
  }

  // ---- Gesperrte Skripte freischalten ------------------------------------
  // Wandelt <script type="text/plain" data-consent="X"> in echte Skripte um,
  // wenn die Kategorie X erlaubt wurde.
  function aktiviereSkripte(daten) {
    var platzhalter = document.querySelectorAll('script[type="text/plain"][data-consent]');
    platzhalter.forEach(function (alt) {
      var kategorie = alt.getAttribute('data-consent');
      var erlaubt = (kategorie === 'statistik' && daten.statistik) ||
                    (kategorie === 'marketing' && daten.marketing);
      if (!erlaubt) return;

      var neu = document.createElement('script');
      // Attribute übernehmen (z. B. src), aber type korrigieren
      for (var i = 0; i < alt.attributes.length; i++) {
        var a = alt.attributes[i];
        if (a.name === 'type' || a.name === 'data-consent') continue;
        neu.setAttribute(a.name, a.value);
      }
      neu.type = 'text/javascript';
      if (alt.textContent) neu.textContent = alt.textContent;
      alt.parentNode.replaceChild(neu, alt);
    });
  }

  // ---- Banner / Modal steuern --------------------------------------------

  function el(id) { return document.getElementById(id); }

  function zeigeBanner() {
    var banner = el('consent-banner');
    if (banner) banner.hidden = false;
  }
  function versteckeBanner() {
    var banner = el('consent-banner');
    if (banner) banner.hidden = true;
  }
  function oeffneEinstellungen() {
    var overlay = el('consent-settings-overlay');
    if (overlay) overlay.classList.add('is-open');
  }
  function schliesseEinstellungen() {
    var overlay = el('consent-settings-overlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  // Schaltet die Kategorien nach einer Entscheidung frei und räumt auf
  function anwenden(statistik, marketing) {
    var daten = speichereEntscheidung(statistik, marketing);
    aktiviereSkripte(daten);
    versteckeBanner();
    schliesseEinstellungen();
  }

  // ---- Start -------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    var vorhanden = ladeEntscheidung();

    // Checkboxen im Einstellungs-Modal auf gespeicherten Stand setzen
    var boxStat = el('consent-cat-statistik');
    var boxMark = el('consent-cat-marketing');
    if (vorhanden) {
      if (boxStat) boxStat.checked = vorhanden.statistik;
      if (boxMark) boxMark.checked = vorhanden.marketing;
      // Bereits entschieden: erlaubte Skripte direkt laden, kein Banner
      aktiviereSkripte(vorhanden);
    } else {
      // Noch keine Entscheidung: Banner zeigen
      zeigeBanner();
    }

    // Banner-Buttons
    var btnAccept = el('consent-accept');
    var btnReject = el('consent-reject');
    var btnSettings = el('consent-settings');
    if (btnAccept)  btnAccept.addEventListener('click', function () { anwenden(true, true); });
    if (btnReject)  btnReject.addEventListener('click', function () { anwenden(false, false); });
    if (btnSettings) btnSettings.addEventListener('click', oeffneEinstellungen);

    // Modal-Buttons
    var btnSave = el('consent-save');
    var btnAcceptAll = el('consent-accept-all');
    var btnClose = el('consent-settings-close');
    if (btnSave) btnSave.addEventListener('click', function () {
      anwenden(boxStat && boxStat.checked, boxMark && boxMark.checked);
    });
    if (btnAcceptAll) btnAcceptAll.addEventListener('click', function () {
      if (boxStat) boxStat.checked = true;
      if (boxMark) boxMark.checked = true;
      anwenden(true, true);
    });
    if (btnClose) btnClose.addEventListener('click', schliesseEinstellungen);

    // Klick auf den dunklen Hintergrund schließt das Modal
    var overlay = el('consent-settings-overlay');
    if (overlay) overlay.addEventListener('click', function (e) {
      if (e.target === overlay) schliesseEinstellungen();
    });

    // Footer-Link "Cookie-Einstellungen" öffnet das Modal jederzeit erneut
    var footerLink = el('cookie-settings-link');
    if (footerLink) footerLink.addEventListener('click', function (e) {
      e.preventDefault();
      oeffneEinstellungen();
    });
  });
})();
