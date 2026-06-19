#!/bin/sh
set -e

BFF="${BFF_UPSTREAM:-http://bff-external:8080}"

case "$BFF" in
  http://*|https://*) ;;
  *) BFF="https://${BFF}" ;;
esac

# Escape sed delimiter in URL
BFF_ESCAPED=$(printf '%s\n' "$BFF" | sed 's/[&/\]/\\&/g')
sed "s|\${BFF_UPSTREAM}|${BFF_ESCAPED}|g" \
  /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
