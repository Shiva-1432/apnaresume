ARG BUILDER_IMAGE=node:20.19.5-bookworm-slim

FROM ${BUILDER_IMAGE} AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["server.js"]
