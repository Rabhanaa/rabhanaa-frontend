FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --ignore-scripts --prefer-offline
COPY . .

# Vite substitutes import.meta.env.VITE_* into the bundle at BUILD time, so every
# one of these has to exist before `npm run build` runs. Without them the build
# still succeeds and ships `undefined` — the site loads and silently cannot reach
# the API, with no error in any log. Coolify passes env vars marked
# "Is Build Variable? = ON" through as --build-arg, which is what these pick up.
ARG VITE_API_URL
ARG VITE_FB_PIXEL_ID
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_VAPID_KEY

ENV VITE_API_URL=$VITE_API_URL \
    VITE_FB_PIXEL_ID=$VITE_FB_PIXEL_ID \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

# Fail the build rather than ship a bundle that cannot reach the API.
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL is empty — set it as a BUILD variable" && exit 1)

RUN npm run build
FROM nginx:1.27-alpine AS final
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
LABEL org.opencontainers.image.title="rabhana-frontend" \
      org.opencontainers.image.description="Rabhana auction platform — React PWA" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.created="${BUILD_TIME}" \
      org.opencontainers.image.base.name="nginx:1.27-alpine"

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1