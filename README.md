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
│   ├── print.html              Acta imprimible (A4)
│   ├── config.html             Gestión de áreas
│   ├── css/
│   │   ├── base.css            Estilos compartidos (form + modal)
│   │   ├── form.css            Estilos del formulario
│   │   ├── lista.css           Estilos del listado y modal
│   │   └── print.css           Estilos del acta imprimible
│   └── js/
│       ├── shared.js           Helpers comunes (PhoneList, ChipList, buildPayload…)
│       ├── form.js             Lógica del formulario
│       ├── lista.js            Lógica del listado y edición
│       └── print.js            Lógica del acta imprimible
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

## Migración de datos

Al actualizar desde una versión anterior (donde los chips estaban dentro de cada teléfono), correr una sola vez:

```bash
# Desarrollo local
yarn migrate

# Producción con Docker
docker compose exec <nombre-servicio> node scripts/migrate.js
# Para ver el nombre del servicio: docker compose ps
```

El script:
- Hace backup automático en `data/registros.bak.json`
- Mueve `chip`/`chip2` de cada teléfono al array independiente `chips`
- Convierte `serial` → `imei1` en los teléfonos
- Agrega los flags `tiene_laptop`, `tiene_telefono`, `tiene_chip`
- Es idempotente — se puede correr más de una vez sin daño

## API

Base: `/api/registros`

| Método | Ruta                    | Descripción                          | Respuesta                      |
|--------|-------------------------|--------------------------------------|--------------------------------|
| GET    | `/api/registros`        | Lista todos los registros            | `200` → array de registros     |
| GET    | `/api/registros/:id`    | Obtiene un registro por ID           | `200` → registro / `404`       |
| GET    | `/api/registros/export` | Exporta todos los registros a .xlsx  | `200` → archivo Excel          |
| POST   | `/api/registros`        | Crea un registro                     | `201` → `{ ok: true, id }`     |
| PUT    | `/api/registros/:id`    | Actualiza un registro existente      | `200` → `{ ok: true }` / `404` |

### Forma de un registro

```json
{
  "id": 1781557441260,
  "fecha": "2026-06-15T21:04:01.260Z",
  "nombre": "JUAN PEREZ",
  "cedula": "1234567890",
  "area": "Callcenter",
  "accesorios": ["Mouse", "Mousepad"],
  "tiene_laptop": true,
  "serial_laptop": "ABC123",
  "cargador_laptop": true,
  "clave": "1234",
  "tiene_telefono": true,
  "telefonos": [
    { "imei1": "123456789012345", "imei2": "", "pin": "0000", "cargador": true }
  ],
  "tiene_chip": true,
  "chips": [
    { "numero": "0987654321", "operadora": "CLARO", "tipo": "prepago" }
  ],
  "datos_personales": true,
  "acciones_correctivas": "Se solicitó borrado de datos",
  "observaciones": ""
}
```

Los campos `id` y `fecha` los asigna el servidor al crear. Cuando `tiene_laptop/telefono/chip` es `false`, los campos correspondientes se guardan como `'NO TIENE'` / `[]`.
