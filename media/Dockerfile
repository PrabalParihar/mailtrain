FROM node:24.12.0-bookworm-slim@sha256:7326fb2dbdce998edd72140946851be64ef4a643e8715e138ca467e8e9d92c99
ENV NODE_ENV=production
WORKDIR /app
COPY media/package.json media/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org && node --input-type=module -e "import sharp from 'sharp'; if(sharp.versions.sharp!=='0.35.5'||sharp.versions.vips!=='8.18.7') process.exit(1); console.log(JSON.stringify(sharp.versions))"
RUN groupadd --gid 1001 media && useradd --uid 1001 --gid 1001 --no-create-home media
COPY media/protocol.mjs media/bounds.mjs media/process.mjs ./
COPY media/LICENSES /app/LICENSES
USER 1001:1001
ENTRYPOINT ["node","/app/process.mjs"]
