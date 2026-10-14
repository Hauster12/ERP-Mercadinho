FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY prisma ./prisma
RUN npm run prisma:generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "start"]
