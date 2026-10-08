# AayuYukthi operations app (static build served by nginx)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/operations/package.json ./apps/operations/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci --workspace=@aayuyukthi/operations --include-workspace-root=false 2>/dev/null \
  || npm ci --workspace=apps/operations
COPY packages/ui ./packages/ui
COPY apps/operations ./apps/operations
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace=apps/operations

FROM nginx:1.27-alpine
COPY apps/operations/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/operations/dist /usr/share/nginx/html
EXPOSE 80
