FROM node:23-slim

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY turbo.json ./
COPY apps ./apps

RUN npm install
RUN npx turbo run build

CMD ["node", "build/backend/index.js"]
