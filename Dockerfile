# ############### Etapa 1: Construcción ###################
FROM node:20.17.0-bullseye-slim AS builder

WORKDIR /usr/src/app

# Copiar el package.json y package-lock.json
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

# #################  Etapa 2: Imagen final #####################
FROM node:20-bullseye-slim

WORKDIR /usr/src/app

# Instalar solo lo necesario para correr (no compilar)
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    curl openssl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar desde el builder
COPY --from=builder /usr/src/app /usr/src/app

# Copiar scripts y dependencias de Python
COPY ./python /usr/src/app/python
# COPY ./scripts /usr/src/app/scripts

# Crear directorios necesarios
COPY ./detections /usr/src/app/detections

# Instalar dependencias Python para producción
RUN pip3 install --no-cache-dir -r ./python/requirements.txt

RUN npm install -g @nestjs/cli

# Dar permisos de ejecución a los scripts de Python
# RUN chmod +x /usr/src/app/scripts/*.py 2>/dev/null || true

EXPOSE 3000
# Modo desarrollo, cambiar a `node dist/main` en producción
CMD ["npm", "run", "start:dev"]
# CMD ["npm", "run", "dist/main"]