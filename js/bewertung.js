/*
  ============================================================
  STOWE STUDIO – bewertung.js (Bewertungsformular)
  ============================================================
  Was macht diese Datei?
  1. Sterne-Bewertung: anklickbare Sterne (1–5), barrierefrei.
  2. Prüfung aller Pflichtfelder, bevor abgesendet wird.
  3. Absenden per fetch an Formspree, ohne die Seite zu verlassen.
     Danach wird das Formular ausgeblendet und ein Dankestext gezeigt.
  4. Fehlerbehandlung: bei Problemen eine freundliche Meldung.

  Ohne JavaScript funktioniert das Formular trotzdem (normaler POST) –
  dann übernimmt Formspree die Bestätigungsseite.
  ============================================================
*/

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('review-form');
    if (!form) return;

    var sterneInput = document.getElementById('bewertung-sterne');
    var sterne = Array.prototype.slice.call(form.querySelectorAll('.star'));

    // Mit JavaScript sendet das versteckte Feld die Sterne. Der Fallback-
    // Auswahlliste nehmen wir Name + Pflicht weg, damit sie nichts doppelt sendet.
    sterneInput.setAttribute('name', 'Sterne');
    var nojsSelect = document.getElementById('sterne-nojs');
    if (nojsSelect) { nojsSelect.disabled = true; nojsSelect.removeAttribute('required'); }
    var thanks = document.getElementById('review-thanks');
    var globalError = document.getElementById('form-error-global');
    var submitBtn = document.getElementById('review-submit');

    // ---- Sterne-Bewertung -------------------------------------------------

    function zeigeSterne(wert) {
      sterne.forEach(function (s) {
        var v = parseInt(s.getAttribute('data-value'), 10);
        s.classList.toggle('is-filled', v <= wert);
      });
    }

    function setzeSterne(wert) {
      sterneInput.value = wert;
      sterne.forEach(function (s) {
        var v = parseInt(s.getAttribute('data-value'), 10);
        s.setAttribute('aria-checked', v === wert ? 'true' : 'false');
      });
      zeigeSterne(wert);
      versteckeFehler('sterne');
    }

    sterne.forEach(function (s) {
      var wert = parseInt(s.getAttribute('data-value'), 10);
      // Beim Drüberfahren Vorschau, beim Verlassen wieder aktueller Stand
      s.addEventListener('mouseenter', function () { zeigeSterne(wert); });
      s.addEventListener('click', function () { setzeSterne(wert); });
      // Tastatur: Pfeiltasten hoch/runter
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          setzeSterne(Math.min(5, wert + 1));
          sterne[Math.min(5, wert + 1) - 1].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          setzeSterne(Math.max(1, wert - 1));
          sterne[Math.max(1, wert - 1) - 1].focus();
        }
      });
    });

    var starRating = form.querySelector('.star-rating');
    if (starRating) {
      starRating.addEventListener('mouseleave', function () {
        zeigeSterne(parseInt(sterneInput.value, 10) || 0);
      });
    }

    // ---- Fehlermeldungen --------------------------------------------------

    function zeigeFehler(feld, text) {
      var el = form.querySelector('[data-error-for="' + feld + '"]');
      if (el) { el.textContent = text; el.classList.add('is-visible'); }
    }
    function versteckeFehler(feld) {
      var el = form.querySelector('[data-error-for="' + feld + '"]');
      if (el) { el.textContent = ''; el.classList.remove('is-visible'); }
    }

    // ---- Prüfung ----------------------------------------------------------

    function pruefe() {
      var ok = true;
      var produkt = document.getElementById('produkt');
      var name = document.getElementById('name');
      var text = document.getElementById('text');
      var email = document.getElementById('email');
      var einwilligung = document.getElementById('einwilligung');

      if (!produkt.value) { zeigeFehler('produkt', 'Bitte wähle ein Produkt aus.'); ok = false; }
      else versteckeFehler('produkt');

      if (!sterneInput.value) { zeigeFehler('sterne', 'Bitte vergib mindestens einen Stern.'); ok = false; }
      else versteckeFehler('sterne');

      if (!name.value.trim()) { zeigeFehler('name', 'Bitte gib deinen Namen oder ein Kürzel an.'); ok = false; }
      else versteckeFehler('name');

      if (!text.value.trim()) { zeigeFehler('text', 'Bitte schreib uns kurz deine Meinung.'); ok = false; }
      else versteckeFehler('text');

      // E-Mail ist optional – nur prüfen, wenn etwas eingetragen wurde
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        zeigeFehler('email', 'Bitte gib eine gültige E-Mail-Adresse an (oder lass das Feld leer).');
        ok = false;
      } else versteckeFehler('email');

      if (!einwilligung.checked) {
        zeigeFehler('einwilligung', 'Ohne deine Einwilligung können wir die Bewertung leider nicht annehmen.');
        ok = false;
      } else versteckeFehler('einwilligung');

      return ok;
    }

    // ---- Absenden ---------------------------------------------------------

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      globalError.hidden = true;

      if (!pruefe()) {
        // Zum ersten Fehler scrollen
        var ersterFehler = form.querySelector('.form-error.is-visible');
        if (ersterFehler) ersterFehler.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet …';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (antwort) {
          if (antwort.ok) {
            form.hidden = true;
            thanks.hidden = false;
            thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            throw new Error('HTTP ' + antwort.status);
          }
        })
        .catch(function () {
          globalError.textContent = 'Es gab ein Problem beim Absenden. Bitte versuche es ' +
            'später erneut oder schreib uns an stowestudioofficial@gmail.com.';
          globalError.hidden = false;
          globalError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          submitBtn.disabled = false;
          submitBtn.textContent = 'Bewertung absenden';
        });
    });
  });
})();
