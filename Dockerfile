FROM n8nio/n8n:1.107.3

USER root

# Install dependencies for Playwright/Chromium and node-fetch
RUN apk add --no-cache \
    bash \
    wget \
    curl \
    unzip \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    chromium \
    chromium-chromedriver \
    && npm install -g playwright node-fetch

# Install Playwright + Chromium
RUN npx playwright install chromium

# Create directory for custom scripts
RUN mkdir -p /home/node/scripts

# Copy your Playwright script(s) into container
COPY scrape.js /home/node/scripts/scrape.js
COPY verify.js /home/node/scripts/verify.js

# Give ownership to node user
RUN chown -R node:node /home/node/scripts

# Set environment variables for proxies (if you want to pass them in container)
# ENV PROXY_LIST="http://51.158.68.133:8811, http://185.44.12.85:8080"

USER node
