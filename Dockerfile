# Production image preparation only. Startup fails until release evidence passes.
FROM node:24.12.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
FROM dependencies AS build
COPY . .
RUN npm run build
FROM node:24.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
RUN groupadd --system --gid 1001 lettercape && useradd --system --uid 1001 --gid 1001 lettercape
COPY --from=build --chown=1001:1001 /app/.next/standalone ./
COPY --from=build --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=build --chown=1001:1001 /app/public ./public
COPY --from=build /app/release-gates.json ./release-gates.json
COPY --from=build /app/scripts/start-production.mjs ./scripts/start-production.mjs
USER 1001:1001
EXPOSE 3000
CMD ["node","scripts/start-production.mjs"]
