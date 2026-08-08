#!/usr/bin/env bash
# ============================================================
# check-todos.sh
# ------------------------------------------------------------
# Durchsucht die Codebase nach offenen Platzhaltern:
#   - class="todo-marker"   (sichtbare rote Marker im HTML)
#   - [[ AUSFÜLLEN ...]]     (fehlende Daten)
#
# Gibt alle Fundstellen mit Datei und Zeilennummer aus und
# bricht mit Exit-Code 1 ab, wenn noch welche vorhanden sind.
# So verhinderst du versehentlichen Livegang mit Lücken.
#
# Nutzung:   bash scripts/check-todos.sh   (oder: npm run check-todos)
# ============================================================
set -u

# Muster: tatsächliche Verwendung (nicht die CSS-Definition) + AUSFÜLLEN-Platzhalter
PATTERN='class="[^"]*todo-marker|\[\[ *AUSF'

MATCHES=$(grep -rniE "$PATTERN" \
  --include='*.html' --include='*.js' --include='*.css' --include='*.md' \
  . 2>/dev/null)

if [ -n "$MATCHES" ]; then
  echo "⚠️  Offene Platzhalter gefunden – bitte NICHT live gehen:"
  echo "------------------------------------------------------------"
  echo "$MATCHES"
  echo "------------------------------------------------------------"
  COUNT=$(printf '%s\n' "$MATCHES" | grep -c .)
  echo "Gesamt: $COUNT Fundstelle(n). Bitte alle ausfüllen."
  exit 1
else
  echo "✅ Keine offenen Platzhalter (todo-marker / AUSFÜLLEN) gefunden."
  exit 0
fi
