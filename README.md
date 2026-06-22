# Barrido de Activos

Formulario web para registrar el barrido de activos asignados a colaboradores
(laptop, teléfonos, accesorios, chips) con listado, búsqueda y edición.

Stack: Node.js + Express en el backend, HTML/CSS/JS sin frameworks en el frontend.
Los datos se guardan en un archivo JSON (sin base de datos).

## Estructura del proyecto

```
.
├── server.js                   Arranque del servidor (Express)
├── src/
│   ├── store.js                Capa de datos: lee/escribe data/registros.json
│   └── registros.routes.js     Rutas de la API /api/registros
├── public/                     Frontend estático servido por Express
│   ├── index.html              Formulario de nuevo registro
│   ├── lista.html              Listado + modal de edición
│   ├── css/
│   │   ├── base.css            Estilos compartidos por ambas páginas
│   │   ├── form.css            Estilos del formulario
│   │   └── lista.css           Estilos del listado y modal
│   └── js/
│       ├── shared.js           Helpers comunes (validación, API, teléfonos…)
│       ├── form.js             Lógica del formulario
│       └── lista.js            Lógica del listado y edición
├── data/
│   └── registros.json          Almacenamiento de los registros (persistente)
├── Dockerfile
├── docker-compose.yml
├── .env                        Configuración local (no se versiona)
└── .env.example                Plantilla de configuración
```

Cada archivo tiene una sola responsabilidad: `store.js` solo sabe de datos,
`registros.routes.js` solo de HTTP, `server.js` solo conecta las piezas.

## Requisitos

- Node.js 20+ y [Yarn](https://yarnpkg.com/) (para desarrollo local), **o**
- Docker + Docker Compose (para producción).

## Desarrollo local

```bash
yarn install
yarn start
```

Abrir http://localhost:3000

El puerto se puede cambiar con la variable de entorno `PORT`:

```bash
PORT=4000 yarn start
```

## Despliegue con Docker

Pensado para un servidor Linux donde el puerto 3000 ya está ocupado por otros
contenedores. El puerto expuesto se controla desde `.env`.

```bash
# 1. Crear el archivo de configuración a partir de la plantilla
cp .env.example .env

# 2. Editar el puerto del host si hace falta
nano .env

# 3. Construir y levantar en segundo plano
docker compose up -d --build
```

Acceso: `http://IP_DEL_SERVER:HOST_PORT` (por defecto el puerto `3001`).

Comandos útiles:

```bash
docker compose logs -f      # ver logs en vivo
docker compose ps           # estado del contenedor
docker compose down         # detener (los datos se conservan)
docker compose up -d --build  # reconstruir tras cambios de código
```

## Variables de entorno

Definidas en `.env` (ver `.env.example`):

| Variable    | Por defecto | Descripción                                                        |
|-------------|-------------|--------------------------------------------------------------------|
| `HOST_PORT` | `3001`      | Puerto expuesto en el servidor Linux. Cambialo si choca con otro.  |
| `PORT`      | `3000`      | Puerto interno del contenedor. No necesita cambiarse (está aislado). |

El mapeo de Docker es `HOST_PORT:PORT`: el tráfico que llega al host por
`HOST_PORT` se redirige al puerto `PORT` dentro del contenedor.

## Persistencia de datos

Los registros viven en `data/registros.json`. En Docker, ese directorio se monta
como volumen (`./data:/app/data`), por lo que **los datos sobreviven** a
reinicios, `docker compose down` y reconstrucciones de la imagen.

Backup: copiar el archivo `data/registros.json`.

## API

Base: `/api/registros`

| Método | Ruta                  | Descripción                          | Respuesta                     |
|--------|-----------------------|--------------------------------------|-------------------------------|
| GET    | `/api/registros`      | Lista todos los registros            | `200` → array de registros    |
| POST   | `/api/registros`      | Crea un registro                     | `201` → `{ ok: true, id }`    |
| PUT    | `/api/registros/:id`  | Actualiza un registro existente      | `200` → `{ ok: true }` / `404`|

### Forma de un registro

```json
{
  "nombre": "JUAN PEREZ",
  "cedula": "1234567890",
  "area": "Callcenter",
  "accesorios": ["Mouse", "Cargador laptop"],
  "serial_laptop": "ABC123",
  "telefonos": [
    { "serial": "S1", "chip": "0987654321", "cargador": true }
  ],
  "datos_personales": false,
  "observaciones": "",
  "id": 1781557441260,
  "fecha": "2026-06-15T21:04:01.260Z"
}
```

Los campos `id` y `fecha` los asigna el servidor al crear el registro.
