FROM --platform=linux/amd64 node:24.12.0-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8 AS node-runtime
FROM --platform=linux/amd64 clamav/clamav:1.4.6_base@sha256:90effb795234e6a93b070310a4bab5a58d93d94b9a077a09ce2229947679782b
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY media/protocol.mjs media/scan.mjs ./
COPY media/LICENSES /app/LICENSES
USER 100:101
ENTRYPOINT ["node","/app/scan.mjs"]
