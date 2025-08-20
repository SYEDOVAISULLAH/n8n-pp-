# Use Debian-based n8n image
FROM n8nio/n8n:1.77.1

USER root

# Install dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    fonts-liberation libasound2 libatk1.0-0 libcups2 libdbus-1-3 \
    libdrm2 libgbm1 libglib2.0-0 libnspr4 libnss3 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libxshmfence1 \
    libxss1 libxtst6 xdg-utils \
    libu2f-udev libvulkan1 unzip curl && \
    rm -rf /var/lib/apt/lists/*

# Install Playwright + Chromium
RUN npm install -g playwright && npx playwright install --with-deps chromium

USER node
