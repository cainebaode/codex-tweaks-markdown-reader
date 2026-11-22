#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
for runtime in "$(command -v node || true)" /opt/homebrew/bin/node /usr/local/bin/node; do
  if [ -n "$runtime" ] && [ -x "$runtime" ] &&
    "$runtime" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' >/dev/null 2>&1; then
    exec "$runtime" ./dist/server.mjs
  fi
done
printf '%s\n' 'Markdown Reader requires Node.js 22 or newer.' >&2
exit 1
