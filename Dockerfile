FROM node:24 AS base
RUN npm install -g pnpm@10

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nuxt.config.ts ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm nuxt generate

FROM nginx:alpine AS runtime
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
