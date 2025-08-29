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

# Update Playwright to the latest version
RUN npm install -g playwright@latest

# Install Playwright and download the browser binaries
RUN npx playwright install --force

# Set the Playwright cache directory to avoid path issues
ENV PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright

# Set proxy environment variables
ENV PROXY_LIST="http://51.158.68.133:8811, http://185.44.12.85:8080"
ENV HTTP_PROXY="http://51.158.68.133:8811"
ENV HTTPS_PROXY="http://51.158.68.133:8811"
ENV FTP_PROXY="http://51.158.68.133:8811"
ENV NO_PROXY="localhost,127.0.0.1"  # No proxy for local addresses

# Create directory for custom scripts
RUN mkdir -p /home/node/scripts

# Copy your Playwright script(s) into container
COPY scrape.js /home/node/scripts/scrape.js
COPY verify.js /home/node/scripts/verify.js
COPY workflow.js /home/node/scripts/workflow.js
COPY linkedin.js /home/node/scripts/linkedin.js  # Don't forget to copy the new script

# Give ownership to node user
RUN chown -R node:node /home/node/scripts

USER node
