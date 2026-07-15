#!/bin/bash
set -e

echo "Renewing Let's Encrypt certificates via webroot (zero downtime)..."
docker run --rm \
    -v $(pwd)/letsencrypt:/acme.sh \
    -v $(pwd)/acme-challenge:/var/www/acme-challenge \
    neilpang/acme.sh --renew -d quantum.xflowresearch.com -w /var/www/acme-challenge --server letsencrypt

echo "Reloading NGINX configuration to pick up new certificates..."
docker compose exec nginx nginx -s reload

echo "Renewal process completed."
