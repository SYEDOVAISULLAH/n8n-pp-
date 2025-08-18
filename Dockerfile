# Start from the official n8n image
FROM n8nio/n8n:1.77.1-debian

# Install dependencies needed for Chromium/Playwright
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    libasound2 libatk1.0-0 libcups2 libdbus-1-3 \
    libdrm2 libgbm1 libglib2.0-0 libnspr4 libnss3 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libxshmfence1 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright and Chromium
RUN npm install -g playwright \
    && npx playwright install chromium

# n8n starts normally
