# Imagen base con Node 20 y yarn incluido
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas)
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copiar el resto del codigo
COPY . .

# Puerto interno del contenedor (configurable via env)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
