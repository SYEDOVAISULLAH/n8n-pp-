FROM n8nio/n8n:1.107.3

USER root

# Install dependencies for Playwright/Chromium (Alpine)
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

USER node
