FROM n8nio/n8n:1.107.3

USER root

# Install dependencies for Playwright/Chromium
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
    chromium-chromedriver

# Install Playwright + Chromium
RUN npm install -g playwright && npx playwright install chromium

# Create directory for custom scripts
RUN mkdir -p /home/node/scripts

# Copy your Playwright script(s) into container
COPY scrape.js /home/node/scripts/scrape.js

# Give ownership to node user
RUN chown -R node:node /home/node/scripts

USER node
