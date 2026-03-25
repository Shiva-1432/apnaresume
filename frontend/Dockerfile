ARG BUILDER_IMAGE=node:20.19.5-bookworm-slim

FROM ${BUILDER_IMAGE} AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM ${BUILDER_IMAGE} AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node_modules/next/dist/bin/next", "start", "-p", "3000"]
