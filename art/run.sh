#!/bin/bash
# usage: art/run.sh <job> <images...>
#   reads art/prompts/<job>.txt (plus the shared style / cast blocks it names), runs codex image_gen,
#   the PNG lands in art/src/<job>.png, the log in art/prompts/<job>.log
A="D:/ClaudeAbout/small-plays/jolly2/v2/art"; cd "$A/src"
J=$1; shift; ARGS=()
for i in "$@"; do ARGS+=(-i "$i"); done
python "$A/compose.py" "$J" > "$A/prompts/$J.full.txt" || exit 1
timeout 1500 codex exec -s workspace-write --skip-git-repo-check -C "$A/src" "${ARGS[@]}" - < "$A/prompts/$J.full.txt" > "$A/prompts/$J.log" 2>&1
echo "exit $?" >> "$A/prompts/$J.log"
