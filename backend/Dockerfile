# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000

# Production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Application source + bundled assets (Bible data, proto schema, templates, images)
COPY src ./src
COPY proto ./proto
COPY bible ./bible
COPY assets ./assets
COPY data ./data

# Ensure all bundled files are readable by the unprivileged runtime user
# regardless of the permissions they had in the build context.
RUN chmod -R a+rX src proto bible assets data

# Run as the built-in unprivileged user
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
