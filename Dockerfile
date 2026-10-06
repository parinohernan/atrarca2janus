# OpenSSL CLI requerido por wsaa.service.js (firma CMS del TRA para AFIP/ARCA)
FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
