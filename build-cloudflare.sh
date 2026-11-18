#!/usr/bin/env sh
# Package only the static site files Cloudflare Pages needs.
set -eu

mkdir -p dist/assets
cp index.html styles.css app.js dist/
cp assets/21nfinity-logo.png assets/bedroom-backdrop.jpg dist/assets/
