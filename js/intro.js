/*
  ============================================================
  STOWE STUDIO – intro.js  (Steuerung der 3D-Intro-Animation)
  ============================================================
  Diese Datei steuert den Ablauf der Intro-Szene:
    - Startet die Animation, wenn die Seite geladen ist
    - Sperrt kurz das Scrollen dahinter
    - Blendet das Intro nach der Animation automatisch aus
    - "Überspringen"-Button beendet es sofort
    - Respektiert "reduzierte Bewegung" (dann kein Intro)

  Du musst hier normalerweise nichts ändern.

  Zwei einfache Einstellungen findest du direkt hier oben:
*/

// Wie lange läuft die Intro-Szene (in Millisekunden)?  3400 = 3,4 Sekunden
var INTRO_DAUER = 3400;

// Soll das Intro pro Besuch nur EINMAL laufen (nicht bei jedem Neuladen)?
// true  = nur einmal je Browser-Sitzung (angenehmer für wiederkehrende Nutzer)
// false = bei jedem Seitenaufruf
var INTRO_NUR_EINMAL = false;


(function () {
  var intro = document.getElementById("intro");
  // Falls es keinen Intro-Block gibt (z. B. du hast ihn entfernt): nichts tun.
  if (!intro) return;

  // WICHTIG: Verhindern, dass der Browser beim Neuladen zu einer alten
  // Scroll-Position springt. So startet der Kunde nach dem Intro immer
  // ganz OBEN auf der Seite (und nicht mittendrin).
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  // Prüfen, ob der/die Nutzer/in "reduzierte Bewegung" bevorzugt
  var wenigerBewegung = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Prüfen, ob das Intro in dieser Sitzung schon lief
  var schonGesehen = INTRO_NUR_EINMAL &&
    sessionStorage.getItem("stowe_intro_gesehen") === "ja";

  // Wenn keine Animation gewünscht/nötig ist: Intro sofort entfernen
  if (wenigerBewegung || schonGesehen) {
    intro.parentNode && intro.parentNode.removeChild(intro);
    return;
  }

  // Scrollen der Seite dahinter sperren, solange das Intro läuft
  document.body.classList.add("intro-active");

  /*
    Beendet das Intro: sanft ausblenden, dann ganz entfernen und
    das Scrollen wieder freigeben.
  */
  var beendet = false;
  function beendeIntro() {
    if (beendet) return;   // nur einmal ausführen
    beendet = true;

    intro.classList.add("is-done");            // startet das Ausblenden (CSS)
    document.body.classList.remove("intro-active");

    // Sicherstellen, dass der Kunde ganz oben auf der Seite startet
    window.scrollTo(0, 0);

    if (INTRO_NUR_EINMAL) {
      sessionStorage.setItem("stowe_intro_gesehen", "ja");
    }

    // Nach der Ausblend-Animation (0.9s) das Element ganz aus dem
    // Dokument nehmen, damit es nicht mehr im Weg ist.
    setTimeout(function () {
      intro.parentNode && intro.parentNode.removeChild(intro);
    }, 950);
  }

  // 1) Automatisch beenden, wenn die Szene durch ist
  var timer = setTimeout(beendeIntro, INTRO_DAUER);

  // 2) "Überspringen"-Button beendet sofort
  var skip = document.getElementById("intro-skip");
  if (skip) {
    skip.addEventListener("click", function () {
      clearTimeout(timer);
      beendeIntro();
    });
  }

  // 3) Komfort: Mit der Taste "Escape" ebenfalls überspringen
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !beendet) {
      clearTimeout(timer);
      beendeIntro();
    }
  });
})();
