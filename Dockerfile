# Imagen base con Node 20 y yarn incluido
FROM node:20-alpine

# Python + zbar para detección de códigos de barras server-side
RUN apk add --no-cache python3 zbar && \
    python3 -m venv /venv && \
    /venv/bin/pip install --no-cache-dir pyzbar Pillow

ENV PYTHON_PATH=/venv/bin/python3

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas)
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copiar el resto del codigo
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
