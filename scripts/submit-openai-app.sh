#!/usr/bin/env bash
# submit-openai-app.sh — hausfold's listing in OpenAI's app portal, one tab at
# a time: the tool-annotation justifications, the demo recording, the starter
# prompts, the eight test cases, availability, and the release notes.
#
#   scripts/submit-openai-app.sh          every step in order
#   scripts/submit-openai-app.sh <step>   one step (check annotations record
#                                         starters testing global submit)
#   scripts/submit-openai-app.sh print    print everything, paste nothing
#
# Every step that fills a form paces it through the CLIPBOARD: it names the
# field, copies the text, and waits for you to ⌘V and press return. You never
# retype and you never lose your place. macOS only: pbcopy, open, ⌘⇧5.
#
# WHY this is a script and not a document: the five prompts the reviewer runs
# and the five the video shows have to be the SAME five in the same order, or
# they watch one thing and test another. One array is the only way that
# survives a resubmission.
#
# THE SEAM: the arrays below are written against MCP_TOOLS in worker-config.js.
# Three tools is why ANNOTATIONS has nine rows — every tool answers Read Only,
# Open World and Destructive — so a fourth tool means three more justifications,
# a positive case that reaches it, and a probe in `check`. test/submission.test.js
# holds all of that, and holds each justification's STATED value to the hint the
# server actually reports, so `npm test` fails rather than a reviewer noticing.
#
# What no test can see: `check` probes the SERVER, and the copy below describes
# it. Both can be true while the video shows something else.
#
# The third positive case (POSITIVE[2]) asks for the asset's byte size on
# purpose, and the video runs it third. A bare "what's the latest version"
# routes to ChatGPT's web search instead of the connector; the byte count is
# the one fact only the tool has.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$REPO_ROOT/worker-config.js"
MCP_URL="https://hausfold.co/mcp"
CHALLENGE_URL="https://hausfold.co/.well-known/openai-apps-challenge"
PORTAL="https://platform.openai.com/apps"
STATE="${XDG_CACHE_HOME:-$HOME/.cache}/hausfold/openai-submit"
VIDEO_DIR="${VIDEO_DIR:-$HOME/Movies}"
VIDEO="$VIDEO_DIR/hausfold-openai-demo.mov"

b=$'\033[1m'; d=$'\033[2m'; g=$'\033[32m'; y=$'\033[33m'; rd=$'\033[31m'; r=$'\033[0m'
note()  { printf '%s      %s%s\n' "$d" "$1" "$r"; }
ok()    { printf '%s      ✓ %s%s\n' "$g" "$1" "$r"; }
warn()  { printf '%s      ! %s%s\n' "$y" "$1" "$r"; }
bad()   { printf '%s      ✗ %s%s\n' "$rd" "$1" "$r"; }
head_() { printf '\n%s%s%s\n' "$b" "$1" "$r"; }
visit() { note "opening $1"; open "$1" 2>/dev/null || note "open this: $1"; }
pause() { read -r -p "      press ↵ when done (Ctrl-C to stop) "; }
confirm(){ local a; read -r -p "      type $1 to continue: " a; [ "$a" = "$1" ] || { echo "      stopped."; exit 1; }; }
copy()  { printf '%s' "$1" | pbcopy; }
wrap()  { printf '%s' "$1" | fold -s -w 76 | sed "s/^/${d}      /;s/$/${r}/"; }

mkdir -p "$STATE"

# ---- the form's contents, as data ------------------------------------------
STARTERS=(
"Install the hacker desktop on my Mac"
"What's the latest hausfold Pounce release and how big is the download?"
"How do I stop my Mac notifying me twice for the same thing?"
"Which hausfold desktop should I pick, and what's the one-liner for it?"
)

POSITIVE=(
"Give me the install command for the hausfold hacker desktop.	Calls get_install_command with desktop: \"hacker\" and answers with the one-line installer, unedited.	One desktops row. command is exactly \`curl -fsSL https://hausfold.co/hacker.sh | bash\`, pins is \"hacker\", and note says what running it does.	None. The endpoint is public and unauthenticated, so there is no account, key or seeded data to set up."
"What hausfold desktops are there, and how do I install each one?	Calls get_install_command with no argument and lists every desktop instead of guessing at one.	Four desktops rows: the haus chooser plus the three desktops hacker, everyday and minimal. The haus row's pins is null, because that URL asks which desktop to build rather than answering.	None."
"Ask hausfold for the latest Pounce release: the exact asset file name, its size in bytes, and the download URL.	Calls get_latest_release with app: \"pounce\". The exact asset file name and byte size for the current release are what the tool is for, so an answer from memory is stale or invented and the tool card carries the real ones.	tag like v2026.09.11, asset ending -macos.dmg, size in bytes, a github.com/hausfold/pounce/releases/download URL, and an ISO publishedAt.	None. Pounce has published releases, so this answers for any reviewer at any time."
"Search the hausfold docs for how notifications work.	Calls search_docs with that query and cites the pages it found instead of answering from memory.	A results array, highest score first, each row carrying a site-relative /docs/... url, breadcrumbs, an excerpt and a score.	None."
"I want hausfold's Perch. What's the newest build, and what do the docs say about it?	Chains two tools in one turn: get_latest_release with app: \"perch\", then search_docs for the Perch documentation.	A release payload for perch and a separate results array, answered together, with the download facts kept apart from the docs citations.	None."
)

NEGATIVE=(
"Get me the latest release of trill.	The tool answers isError with error.code unknown_app and the message \"unknown app 'trill'. Available: pounce, perch\". The assistant relays that and names the two apps that do have downloads.	trill is not one of the server's two downloadable apps. It has notarized releases but no cask and no one-line install, and haus.notifications.compositor is its only front door. The failure comes back in the server's own vocabulary, and the assistant must not invent a releases URL to fill the gap."
"Give me the install command for the Windows desktop.	The tool answers isError with error.code unknown_desktop and lists haus, hacker, everyday, minimal. The assistant says the desktops are macOS only and offers the three real ones.	The desktops this server installs are nix-darwin on a Mac, so there is no Windows row to return. A fabricated hausfold.co/windows.sh would be a command a user actually pastes into a shell, so a plausible guess here is worse than a refusal."
"Uninstall haus from this Mac and delete my nix config.	No tool call. Every tool on this server is read-only and none of them touches the machine, so the assistant explains it can only look things up here, and at most searches the docs for the removal steps for the user to run themselves.	The server is a reference surface with no write path. An app that implied it had reached into the filesystem would be claiming a capability it does not have."
)

ANNOTATIONS=(
"get_install_command	Read Only: True	It returns rows from the four-row desktop table compiled into the server. Nothing is written, stored or executed. The install command comes back as text for the user to run on their own machine if they choose to."
"get_install_command	Open World: False	The answer comes from that same in-server table, which is also what generates the tool's desktop enum. There is no network call and no third-party API, so the set of possible answers is those four rows and does not change between calls."
"get_install_command	Destructive: False	Nothing is created, changed or deleted anywhere. The tool hands back a shell one-liner as text. Installing is something the user does afterwards, outside ChatGPT."
"get_latest_release	Read Only: True	It looks up published release metadata for two Mac apps, Pounce and Perch: tag, file name, size, download URL and publish date. It reads GitHub's public releases API with no credentials attached, so it could not write there even if asked to."
"get_latest_release	Open World: True	It calls GitHub's public API at request time. The answer changes whenever a new release is published, so it depends on a system outside this server and cannot be predicted from the input alone."
"get_latest_release	Destructive: False	It is a metadata read. It returns a download URL as text. Nothing is downloaded, installed, overwritten or removed by the tool."
"search_docs	Read Only: True	It searches hausfold's published documentation and returns page URLs, breadcrumbs and excerpts. It reads a prebuilt static index that ships with the site, and there is nothing in the server that a query could alter."
"search_docs	Open World: False	That index is the only corpus searched. No external search service is called and nothing is crawled at request time, so the same query returns the same results until the docs are rebuilt and redeployed."
"search_docs	Destructive: False	A read over a static index. It creates and removes nothing, and the query itself is not stored."
)

# field NAME TEXT — copy one field, show it, wait for the paste.
field() {
  copy "$2"
  printf '\n      %s%s%s\n' "$b" "$1" "$r"
  wrap "$2"
  read -r -p "      copied — ⌘V into that field, then ↵ "
}

# ---- steps -----------------------------------------------------------------

step_check() {
  head_ "Does the server still answer the way the submission says it does?"
  note "every call the test cases promise, against $MCP_URL"
  local failed=0
  probe "install command, hacker"  '{"name":"get_install_command","arguments":{"desktop":"hacker"}}' 'https://hausfold.co/hacker.sh | bash' || failed=1
  probe "every desktop listed"     '{"name":"get_install_command","arguments":{}}' '"minimal"' || failed=1
  probe "latest release, pounce"   '{"name":"get_latest_release","arguments":{"app":"pounce"}}' '-macos.dmg' || failed=1
  probe "latest release, perch"    '{"name":"get_latest_release","arguments":{"app":"perch"}}' '-macos' || failed=1
  probe "docs search"              '{"name":"search_docs","arguments":{"query":"notifications","limit":3}}' '"results"' || failed=1
  probe "unknown app is an error"  '{"name":"get_latest_release","arguments":{"app":"trill"}}' 'unknown_app' || failed=1
  probe "unknown desktop is too"   '{"name":"get_install_command","arguments":{"desktop":"windows"}}' 'unknown_desktop' || failed=1
  # The portal compares the body to the string it minted, with NO trailing
  # newline, so anything weaker than a byte-for-byte match passes while the
  # listing quietly unverifies. cmp compares length too.
  local want tmp
  want="$(sed -n 's/^export const OPENAI_APPS_CHALLENGE = "\(.*\)";$/\1/p' "$CONFIG" 2>/dev/null)"
  tmp="$(mktemp)"
  if ! curl -fsS --max-time 20 "$CHALLENGE_URL" -o "$tmp" 2>/dev/null; then
    bad "$CHALLENGE_URL did not answer — the listing will unverify"; failed=1
  elif [ -z "$want" ]; then
    warn "no OPENAI_APPS_CHALLENGE in $CONFIG — only checked that the URL answers"
  elif printf '%s' "$want" | cmp -s - "$tmp"; then
    ok "domain challenge matches worker-config.js, byte for byte"
  else
    bad "$CHALLENGE_URL is not OPENAI_APPS_CHALLENGE byte for byte (a trailing"
    bad "newline counts) — the listing will unverify"; failed=1
  fi
  rm -f "$tmp"
  if [ "$failed" = 1 ]; then
    warn "something the submission promises is not true right now."
    warn "fix it before you record, or the video records the bug."
    confirm CONTINUE
  else
    ok "everything the submission promises still answers"
  fi
}

probe() { # probe "label" '<params json>' "<needle>"
  local label="$1" params="$2" needle="$3" body
  body="$(curl -fsS --max-time 20 -X POST "$MCP_URL" \
    -H 'content-type: application/json' \
    -H 'accept: application/json, text/event-stream' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":$params}" 2>/dev/null)" || {
      bad "$label — no answer from $MCP_URL"; return 1; }
  if printf '%s' "$body" | grep -qF -- "$needle"; then ok "$label"; else
    bad "$label — expected to find: $needle"; printf '%s\n' "$body" | head -c 300; echo; return 1; fi
}

step_annotations() {
  head_ "MCP tab — the ${#ANNOTATIONS[@]} annotation justifications"
  note "the portal reads the VALUES off the server and asks you for the reasons"
  local n=0 tool flag why
  for row in "${ANNOTATIONS[@]}"; do
    n=$((n+1)); IFS=$'\t' read -r tool flag why <<<"$row"
    field "$n/${#ANNOTATIONS[@]}  $tool · $flag" "$why"
  done
  ok "${#ANNOTATIONS[@]} justifications in"
}

step_record() {
  head_ "Record the demo"
  note "frame it with ⌘⇧5 → Record Selected Portion, dragged around the"
  note "ChatGPT window only. Then this terminal can stay in front of it"
  note "without being in the shot."
  note ""
  note "one new chat, hausfold connector on, developer mode."
  note "run the ${#POSITIVE[@]} below in order and EXPAND each tool-call card, so the"
  note "reviewer sees the tool name and the JSON it answered with."
  note "no narration needed. two minutes is plenty."
  echo
  read -r -p "      press ↵ once you are recording "
  local n=0 prompt rest
  for row in "${POSITIVE[@]}"; do
    n=$((n+1)); IFS=$'\t' read -r prompt rest <<<"$row"
    copy "$prompt"
    printf '\n      %s%d/%d%s %s\n' "$b" "$n" "${#POSITIVE[@]}" "$r" "$prompt"
    note "copied — ⌘V into ChatGPT, ↵, wait for the answer, expand the card"
    read -r -p "      press ↵ when that answer is on screen "
  done
  ok "${#POSITIVE[@]} prompts run — stop the recording (⌘⇧5 stop button, or ⌃⌘Esc)"
  note "save it as: $VIDEO"
  pause
  if [ -f "$VIDEO" ]; then
    ok "$(du -h "$VIDEO" | cut -f1) at $VIDEO"
    note "opening it. watch for a tool card you never expanded, a notification"
    note "banner, or a browser tab title you would rather not ship."
    visit "$VIDEO"; pause
  else
    warn "no file at $VIDEO — set VIDEO_DIR, or rename what you saved"
  fi
  head_ "Upload it unlisted"
  visit "https://studio.youtube.com/"
  note "visibility: Unlisted. NOT Private — a reviewer signed in as themselves"
  note "cannot open a private video, and the submission stalls there."
  note "title: hausfold MCP — app review demo"
  local yt; read -r -p "      paste the watch URL: " yt
  [ -n "$yt" ] || { echo "      no URL, stopping."; exit 1; }
  printf '%s\n' "$yt" > "$STATE/video-url"
  copy "$yt"; ok "saved and copied: $yt"
}

step_starters() {
  head_ "Prompts tab — ${#STARTERS[@]} starter prompts"
  note "one per tool, plus one that needs two of them. A starter that only"
  note "ever fires one tool teaches nobody when to reach for the app."
  local n=0
  for p in "${STARTERS[@]}"; do n=$((n+1)); field "$n/${#STARTERS[@]}  starter prompt" "$p"; done
  ok "${#STARTERS[@]} starters in"
}

step_testing() {
  head_ "Testing tab — ${#POSITIVE[@]} positive, ${#NEGATIVE[@]} negative"
  note "each case is a few fields. If the form shows fewer boxes than this"
  note "walks, press ↵ past the ones it does not have."
  local n=0 prompt expected shape data why
  for row in "${POSITIVE[@]}"; do
    n=$((n+1)); IFS=$'\t' read -r prompt expected shape data <<<"$row"
    printf '\n%s   ── positive %d of %d ──%s\n' "$b" "$n" "${#POSITIVE[@]}" "$r"
    field "prompt"            "$prompt"
    field "expected behavior" "$expected"
    field "result shape"      "$shape"
    field "test data"         "$data"
  done
  n=0
  for row in "${NEGATIVE[@]}"; do
    n=$((n+1)); IFS=$'\t' read -r prompt expected why <<<"$row"
    printf '\n%s   ── negative %d of %d ──%s\n' "$b" "$n" "${#NEGATIVE[@]}" "$r"
    field "prompt"                  "$prompt"
    field "expected safe behavior"  "$expected"
    field "reasoning"               "$why"
  done
  ok "$(( ${#POSITIVE[@]} + ${#NEGATIVE[@]} )) cases in"
}

step_global() {
  head_ "Global tab — availability"
  note "all countries. Nothing here is region-locked: the docs, the installers"
  note "and the release downloads are the same everywhere, and the server"
  note "holds no user data to localise or restrict."
  visit "$PORTAL"; pause
}

step_submit() {
  head_ "Submit tab"
  local yt; yt="$(cat "$STATE/video-url" 2>/dev/null || true)"
  if [ -n "$yt" ]; then note "video: $yt"
  else warn "no video URL saved — run the record step first"; fi
  field "release notes" "First submission. A read-only MCP server for hausfold's Mac software: the one-line install command for each desktop, the latest signed and notarized macOS release of Pounce and Perch, and full-text search of the documentation. No authentication, because the endpoint is public and every tool is a read, so a reviewer needs no credentials and no test account. The demo video runs the five positive test cases in the order they are listed."
  [ -n "$yt" ] && field "demo video URL" "$yt"
  note "then the policy attestations."
  warn "Submit for Review is the step you cannot take back today: the listing"
  warn "goes to a human, and edits wait on the verdict."
  confirm SUBMIT
  visit "$PORTAL"; pause
  printf '\n%s✓ submitted.%s  %s%s print%s reprints everything for a resubmission.\n\n' "$g" "$r" "$d" "$0" "$r"
}

step_print() {
  head_ "Starter prompts"
  for p in "${STARTERS[@]}"; do printf '  · %s\n' "$p"; done
  head_ "Positive test cases (also the video, in this order)"
  local n=0 prompt expected shape data why tool flag
  for row in "${POSITIVE[@]}"; do
    n=$((n+1)); IFS=$'\t' read -r prompt expected shape data <<<"$row"
    printf '\n  %s%d. %s%s\n' "$b" "$n" "$prompt" "$r"
    printf '     expected: %s\n     shape:    %s\n     data:     %s\n' "$expected" "$shape" "$data"
  done
  head_ "Negative test cases"
  n=0
  for row in "${NEGATIVE[@]}"; do
    n=$((n+1)); IFS=$'\t' read -r prompt expected why <<<"$row"
    printf '\n  %s%d. %s%s\n' "$b" "$n" "$prompt" "$r"
    printf '     expected: %s\n     why:      %s\n' "$expected" "$why"
  done
  head_ "Tool annotations"
  for row in "${ANNOTATIONS[@]}"; do
    IFS=$'\t' read -r tool flag why <<<"$row"
    printf '\n  %s%s · %s%s\n     %s\n' "$b" "$tool" "$flag" "$r" "$why"
  done
  echo
}

# ---- dispatch --------------------------------------------------------------
case "${1:-all}" in
  --*) set -- "${1#--}" "${@:2}" ;;
esac

case "${1:-all}" in
  check)       step_check ;;
  annotations) step_annotations ;;
  record)      step_record ;;
  starters|prompts) step_starters ;;
  testing)     step_testing ;;
  global)      step_global ;;
  submit)      step_submit ;;
  print)       step_print ;;
  all)
    printf '%s\n%s\n' "${b}hausfold → OpenAI app portal${r}" \
      "${d}Ctrl-C any time. Every step can be re-run on its own: $0 <step>${r}"
    step_check; step_annotations; step_record; step_starters
    step_testing; step_global; step_submit ;;
  *)
    echo "steps: check annotations record starters testing global submit print"
    exit 1 ;;
esac
