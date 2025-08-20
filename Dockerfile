FROM n8nio/n8n:latest

# Switch to root to install dependencies
USER root

# Install Chromium dependencies
RUN apk add --no-cache \
    nss \
    chromium \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    npm

# Install Playwright + browsers
RUN npm install -g playwright \
    && npx playwright install --with-deps chromium

# Switch back to n8n user
USER node

