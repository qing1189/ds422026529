FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY src/ ./src/

COPY sha3_wasm_bg.wasm ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/index.js"]