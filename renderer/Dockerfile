FROM node:24.12.0-bookworm-slim AS browser-runtime
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright NODE_ENV=production HOST=0.0.0.0 PORT=3024
WORKDIR /app
COPY renderer/package.json renderer/package-lock.json ./
RUN npm ci && ./node_modules/.bin/playwright install --with-deps chromium && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 lettercape && useradd --system --uid 1001 --gid 1001 --create-home lettercape
COPY --chown=1001:1001 renderer/protocol.mjs renderer/browser.mjs renderer/server.mjs ./
COPY release-gates.json ./release-gates.json
USER 1001:1001
EXPOSE 3024
CMD ["node","server.mjs"]
