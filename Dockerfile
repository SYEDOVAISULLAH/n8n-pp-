FROM n8nio/n8n:latest

# Install Alpine packages needed for Chromium
RUN apk add --no-cache \
    nss \
    chromium \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    npm

# Install Playwright + Chromium
RUN npm install -g playwright && \
    npx playwright install chromium
