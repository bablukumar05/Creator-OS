FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared ./shared
RUN npm install --workspace=@creatoros/server --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/shared ./shared
COPY server ./server
USER nodeuser
EXPOSE 5000
CMD ["node", "server/index.js"]
