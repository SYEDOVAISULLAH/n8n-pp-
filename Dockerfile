FROM n8nio/n8n:latest

# Switch to root to install packages
USER root

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

# Switch back to n8n user (important for Railway)
USER node
