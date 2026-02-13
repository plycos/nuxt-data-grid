#!/bin/sh
PORT="${1:-3000}"
docker build -t nuxt-data-grid . && \
echo "Starting on http://localhost:${PORT}" && \
docker run -d --rm -p "${PORT}:80" nuxt-data-grid