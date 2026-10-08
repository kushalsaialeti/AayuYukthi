# AayuYukthi public web app (static build served by nginx)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci --workspace=@aayuyukthi/web --include-workspace-root=false 2>/dev/null \
  || npm ci --workspace=apps/web
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace=apps/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
