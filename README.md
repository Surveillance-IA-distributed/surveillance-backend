# 🎯 Surveillance Backend – NestJS API

Este repositorio contiene el servicio **backend** del sistema de vigilancia distribuido. Está construido con [NestJS](https://nestjs.com/) y se comunica con una base de datos PostgreSQL y una API de análisis en Python.

---

## 📦 Tecnologías

- 🚀 **NestJS** + TypeScript
- 🐘 PostgreSQL
- 🐳 Docker
- 🧪 Validación con `class-validator`
- 📦 Módulos Python embebidos

---

## ⚙️ Configuración para Desarrollo

### 🐳 Requisitos previos

- Docker y Docker Compose
- Clonado el repositorio raíz: [`surveillance-core`](https://github.com/tu-org/surveillance-stack)

### 🛠️ Estructura esperada
```bash
surveillance-stack/
├── docker-compose.yml
├── surveillance-backend/ ← Este repositorio
├── surveillance-db/
├── surveillance-frontend/
```

---

## 🚀 Primeros pasos (DESARROLLO)

### 1. Asegurarse de que el volumen esté montado (en docker-compose.yml)


```bash
  backend:
    volumes:
      - ./surveillance-backend:/usr/src/app       # ✅ Solo para desarrollo
      - /usr/src/app/node_modules                 # ✅ Protege dependencias del contenedor

```

### 2. Levantar el contenedor
Esto se puede hacer desde la raíz del proyecto o desde la carpeta `surveillance-backend`:

```bash
docker-compose build
docker-compose up -d
```

### 3. Instalar dependencias dentro del contenedor

```bash
docker exec -it nest-backend /bin/sh
npm install
```
### 4. (Opcional) Instalar dependencias localmente para soporte en VSCode
```bash
cd surveillance-backend
npm install
```