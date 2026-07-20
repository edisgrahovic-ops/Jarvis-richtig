"use strict";

const $ = (id) => document.getElementById(id);
const log = $("log");
const input = $("input");
const composer = $("composer");
const micBtn = $("micBtn");
const reactor = $("reactor");
const statusDot = $("statusDot");
const statusText = $("statusText");
const hint = $("hint");

const history = []; // { role: 'user'|'assistant', content }
let busy = false;

// Benachrichtigungs-Erlaubnis einmalig bei erster Interaktion anfragen
let askedNotif = false;
function ensureNotifPermission() {
  if (askedNotif || !("Notification" in window)) return;
  askedNotif = true;
  if (Notification.permission === "default") Notification.requestPermission().catch(() => {});
}

// ---------- Status ----------
function setStatus(state, text) {
  statusDot.className = "dot " + (state || "");
  statusText.textContent = text;
}

// ---------- Nachrichten anzeigen ----------
function addMsg(role, text) {
  const el = document.createElement("div");
  el.className = "msg " + role;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

// ---------- Sprachausgabe (Text-to-Speech) ----------
let germanVoice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  germanVoice =
    voices.find((v) => /de[-_]/i.test(v.lang) && /google|microsoft/i.test(v.name)) ||
    voices.find((v) => /de[-_]/i.test(v.lang)) ||
    null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function speak(text) {
  if (!("speechSynthesis" in window) || !text.trim()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  if (germanVoice) u.voice = germanVoice;
  u.rate = 1.02;
  u.pitch = 1;
  u.onstart = () => reactor.classList.add("speaking");
  u.onend = () => reactor.classList.remove("speaking");
  u.onerror = () => reactor.classList.remove("speaking");
  speechSynthesis.speak(u);
}

// ---------- Denk-Anzeige ----------
function addThinking() {
  const el = document.createElement("div");
  el.className = "msg jarvis thinking";
  el.innerHTML = "<span class='typing'><i></i><i></i><i></i></span>";
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

// ---------- An Jarvis senden ----------
async function sendToJarvis(text) {
  if (busy || !text.trim()) return;
  busy = true;
  hint.style.display = "none";
  addMsg("user", text);
  history.push({ role: "user", content: text });
  setStatus("busy", "arbeitet…");
  const thinking = addThinking();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json().catch(() => ({}));
    thinking.remove();
    if (!res.ok) throw new Error(data.error || `Serverfehler ${res.status}`);

    const reply = data.text || "…";
    addMsg("jarvis", reply);
    history.push({ role: "assistant", content: reply });
    speak(reply);

    // vom Server angeforderte Geräte-Aktionen ausführen
    for (const action of data.actions || []) handleAction(action);

    setStatus("ok", "bereit");
  } catch (err) {
    thinking.remove();
    addMsg("error", "⚠ " + err.message);
    setStatus("err", "Fehler");
    setTimeout(() => setStatus("ok", "bereit"), 3000);
  } finally {
    busy = false;
  }
}

// ---------- Geräte-Aktionen (Timer usw.) ----------
function handleAction(action) {
  if (!action) return;
  if (action.type === "timer") {
    const label = action.label || "Timer";
    setTimeout(() => {
      notify("⏰ " + label, "Die Zeit ist um.");
      speak(`Sir, der ${label} ist abgelaufen.`);
      addMsg("jarvis", `⏰ ${label} abgelaufen.`);
    }, action.seconds * 1000);
  }
}

// ---------- Benachrichtigungen ----------
function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "icon.svg" });
      return;
    }
  } catch {}
  // Fallback: hörbar + sichtbar
}

// ---------- Erinnerungen abfragen (Polling) ----------
async function pollReminders() {
  try {
    const res = await fetch("/api/reminders/due");
    const data = await res.json();
    for (const r of data.due || []) {
      notify("🔔 Erinnerung", r.text);
      speak(`Sir, eine Erinnerung: ${r.text}`);
      addMsg("jarvis", `🔔 Erinnerung: ${r.text}`);
    }
  } catch {}
}
setInterval(pollReminders, 30000);

// ---------- Eingabe ----------
composer.addEventListener("submit", (e) => {
  e.preventDefault();
  ensureNotifPermission();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendToJarvis(text);
});

// ---------- Spracherkennung (Speech-to-Text) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "de-DE";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add("listening");
    reactor.classList.add("listening");
    setStatus("busy", "hört zu…");
  };
  recognition.onresult = (e) => {
    let txt = "";
    for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
    input.value = txt;
    if (e.results[e.results.length - 1].isFinal) {
      const finalText = txt.trim();
      input.value = "";
      stopListening();
      if (finalText) sendToJarvis(finalText);
    }
  };
  recognition.onerror = () => { stopListening(); setStatus("ok", "bereit"); };
  recognition.onend = () => stopListening();
} else {
  micBtn.style.opacity = 0.4;
}

function startListening() {
  if (!recognition || listening || busy) return;
  speechSynthesis.cancel();
  try { recognition.start(); } catch { /* schon aktiv */ }
}
function stopListening() {
  listening = false;
  micBtn.classList.remove("listening");
  reactor.classList.remove("listening");
  if (recognition) { try { recognition.stop(); } catch {} }
  if (!busy) setStatus("ok", "bereit");
}
function toggleListening() {
  if (!recognition) {
    addMsg("error", "Spracherkennung wird von diesem Browser nicht unterstützt. Nutze am besten Chrome.");
    return;
  }
  listening ? stopListening() : startListening();
}

micBtn.addEventListener("click", () => { ensureNotifPermission(); toggleListening(); });
reactor.addEventListener("click", () => { ensureNotifPermission(); toggleListening(); });

// ---------- Reaktor-Visualisierung ----------
const viz = $("viz");
const ctx = viz.getContext("2d");
let t = 0;
function draw() {
  const w = viz.width, h = viz.height, cx = w / 2, cy = h / 2;
  ctx.clearRect(0, 0, w, h);
  const active = busy || listening;
  const bars = 48;
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const base = 78;
    const amp = active ? 18 + Math.sin(t * 0.15 + i * 0.6) * 16 : 5 + Math.sin(t * 0.05 + i) * 3;
    const len = Math.max(2, amp);
    ctx.strokeStyle = listening ? "rgba(255,182,74,0.7)" : "rgba(53,214,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * base, Math.sin(angle) * base);
    ctx.lineTo(Math.cos(angle) * (base + len), Math.sin(angle) * (base + len));
    ctx.stroke();
  }
  ctx.restore();
  t += 1;
  requestAnimationFrame(draw);
}
draw();

// ---------- Start ----------
async function init() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.configured) {
      setStatus("ok", "bereit");
      const greeting = "Alle Systeme online. Guten Tag, Sir. Womit kann ich behilflich sein?";
      setTimeout(() => { addMsg("jarvis", greeting); speak(greeting); }, 400);
    } else {
      setStatus("err", "kein API-Key");
      addMsg("error", "Kein API-Schlüssel konfiguriert. Lege eine .env-Datei mit ANTHROPIC_API_KEY an (siehe .env.example).");
    }
  } catch {
    setStatus("err", "offline");
    addMsg("error", "Verbindung zum Server fehlgeschlagen.");
  }
}
init();

// ---------- PWA Service Worker ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
