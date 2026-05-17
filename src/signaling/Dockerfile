FROM node:20-alpine

WORKDIR /app

# Install dependencies (only express and ws are needed)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy signaling server source
COPY src/signaling/server.js ./server.js

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
