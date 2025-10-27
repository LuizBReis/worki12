# backend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar Prisma e gerar client
COPY prisma ./prisma
RUN npx prisma generate

# Copiar código da aplicação
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Iniciar servidor
CMD ["node", "src/server.js"]