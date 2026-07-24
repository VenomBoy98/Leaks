# SJKVY API — multi-stage production image.
# Stage 1: install deps + build TS → JS. Stage 2: minimal runtime, non-root, prod deps.
FROM node:22-slim AS build
WORKDIR /app
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Only production dependencies.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Deployment SQL adapter (self-host auth.uid); harmless on Supabase.
COPY sql ./sql

# Drop privileges.
USER node
EXPOSE 8080

# Container-native healthcheck hits the liveness endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
