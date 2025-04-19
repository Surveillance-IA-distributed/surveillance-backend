# Etapa 1: Construcción
FROM node:20.17.0-bullseye-slim AS builder

WORKDIR /usr/src/app

# Dependencias necesarias para construir
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libgl1 \
    librsvg2-dev \
    libpng-dev \
    libssl1.1 \
    openssl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .

#Instalar las dependencias de python
COPY ./python/requirements.txt ./python/requirements.txt
RUN pip3 install --no-cache-dir -r ./python/requirements.txt

# Etapa 2: Imagen final
FROM node:20-bullseye-slim

WORKDIR /usr/src/app

# Dependencias de runtime
RUN apt-get update && apt-get install -y \
    procps \
    openssl \
    libssl1.1 \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libgl1 \
    librsvg2-dev \
    libpng-dev \
    python3 \
    python3-pip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar todo desde builder
COPY --from=builder /usr/src/app /usr/src/app

# Instalar solo dependencias necesarias para desarrollo
RUN pip3 install --no-cache-dir -r ./python/requirements.txt
RUN npm install
# NestJS CLI global
RUN npm install -g @nestjs/cli


EXPOSE 3000
# Modo desarrollo (con live reload)
CMD ["npm", "run", "start:dev"]
